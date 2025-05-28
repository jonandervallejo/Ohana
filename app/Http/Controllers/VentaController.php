<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\Compra;
use App\Models\Stock;
use App\Models\Producto;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VentaController extends Controller
{
    /**
     * Obtener todas las ventas con sus detalles
     */
    public function index()
    {
        try {
            // Log para depuración
            Log::info('Iniciando consulta de ventas');
            
            // Obtenemos todos los tickets con sus relaciones
            $tickets = Ticket::with(['compra.usuario', 'stock.producto'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            Log::info('Tickets obtenidos: ' . $tickets->count());
            
            // Si no hay tickets, devolvemos array vacío
            if ($tickets->isEmpty()) {
                return response()->json([]);
            }
            
            // Agrupamos los tickets por id_compra
            $ticketsAgrupados = $tickets->groupBy('id_compra');
            
            $ventasFormateadas = $ticketsAgrupados->map(function ($ticketsDeCompra, $idCompra) {
                $compra = $ticketsDeCompra->first()->compra;
                
                // Formatear la fecha de manera segura - MODIFICADO
                $fechaFormateada = null;
                if ($compra->created_at) {
                    try {
                        // Usar la fecha original tal cual está en la base de datos
                        $fechaFormateada = $compra->created_at->format('Y-m-d H:i:s');
                    } catch (\Exception $e) {
                        // Usar un valor fijo en lugar de la fecha actual
                        $fechaFormateada = 'Sin fecha';
                        Log::warning("Error al formatear fecha para compra ID: $idCompra: " . $e->getMessage());
                    }
                } else {
                    // Usar un valor fijo en lugar de la fecha actual
                    $fechaFormateada = 'Sin fecha';
                    Log::warning("created_at es null para compra ID: $idCompra");
                }
                
                // Verificamos que la relación usuario existe
                if (!$compra->usuario) {
                    Log::warning("Usuario no encontrado para compra ID: $idCompra");
                    return [
                        'id' => $compra->id,
                        'fecha' => $fechaFormateada,
                        'estado' => $compra->estado ?? 'pendiente',
                        'cliente' => [
                            'id' => null,
                            'nombre' => 'Usuario no encontrado',
                            'apellidos' => '',
                        ],
                        'productos' => [],
                        'precio_total' => $ticketsDeCompra->sum('precio_total'),
                    ];
                }
                
                // Mapeamos cada ticket a formato de producto
                $productos = $ticketsDeCompra->map(function ($ticket) {
                    if (!$ticket->stock || !$ticket->stock->producto) {
                        return null;
                    }
                    
                    $producto = $ticket->stock->producto;
                    return [
                        'id' => $producto->id,
                        'nombre' => $producto->nombre,
                        'talla' => $ticket->stock->talla, 
                        'color' => $ticket->stock->color,
                        'cantidad' => $ticket->cantidad,
                        'precio_unitario' => $ticket->precio_unitario,
                    ];
                })->filter()->values();
                
                return [
                    'id' => $compra->id,
                    'fecha' => $fechaFormateada,
                    'estado' => $compra->estado ?? 'pendiente',
                    'cliente' => [
                        'id' => $compra->usuario->id,
                        'nombre' => $compra->usuario->name,
                        'apellidos' => $compra->usuario->apellidos ?? '',
                    ],
                    'productos' => $productos,
                    'precio_total' => $ticketsDeCompra->sum('precio_total'),
                ];
            })->filter()->values();
            
            Log::info('Ventas formateadas: ' . $ventasFormateadas->count());
            return response()->json($ventasFormateadas);
            
        } catch (\Exception $e) {
            Log::error('Error al obtener ventas: ' . $e->getMessage());
            // Devolvemos más información para depuración
            return response()->json([
                'error' => 'Error al obtener las ventas',
                'message' => $e->getMessage(),
                'trace' => env('APP_DEBUG') ? $e->getTraceAsString() : null
            ], 500);
        }
    }
    
    /**
     * Crear una nueva venta
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_usuario' => 'required|exists:usuario,id', // Cambiado de users a usuario
            'productos' => 'required|array',
            'productos.*.id_producto' => 'required|exists:producto,id',
            'productos.*.talla' => 'required|string',
            'productos.*.color' => 'required|string',
            'productos.*.cantidad' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        
        try {
            // Validar stock disponible
            foreach ($request->productos as $producto) {
                $stock = Stock::where('id_producto', $producto['id_producto'])
                              ->where('talla', $producto['talla'])
                              ->where('color', $producto['color'])
                              ->first();

                if (!$stock || $stock->stock < $producto['cantidad']) {
                    return response()->json([
                        'error' => "Stock insuficiente para el producto ID {$producto['id_producto']}  {$producto['cantidad']}"
                    ], 400);
                }
            }
            
            // Calcular precio total de la compra
            $precioTotalCompra = 0;
            $productosConPrecios = [];
            
            foreach ($request->productos as $producto) {
                $stock = Stock::where('id_producto', $producto['id_producto'])
                            ->where('talla', $producto['talla'])
                            ->where('color', $producto['color'])
                            ->first();
                            
                $productoInfo = Producto::findOrFail($producto['id_producto']);
                $precioUnitario = $productoInfo->precio;
                $precioTotal = $precioUnitario * $producto['cantidad'];
                $precioTotalCompra += $precioTotal;
                
                $productosConPrecios[] = [
                    'id_stock' => $stock->id,
                    'cantidad' => $producto['cantidad'],
                    'precio_unitario' => $precioUnitario,
                    'precio_total' => $precioTotal,
                ];
            }
            
            // Crear la compra
            $compra = new Compra();
            $compra->id_usuario = $request->id_usuario;
            $compra->estado = 'pendiente';
            $compra->save();
            
            // Crear los tickets asociados a la compra
            foreach ($productosConPrecios as $producto) {
                $ticket = new Ticket();
                $ticket->id_compra = $compra->id;
                $ticket->id_stock = $producto['id_stock'];
                $ticket->cantidad = $producto['cantidad'];
                $ticket->precio_unitario = $producto['precio_unitario'];
                $ticket->precio_total = $producto['precio_total'];
                $ticket->estado = 'pendiente';
                $ticket->save();
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Venta creada exitosamente',
                'id' => $compra->id
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear venta: ' . $e->getMessage());
            return response()->json(['error' => 'Error al crear la venta: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Completar una venta y reducir stock
     */
    public function completar($id)
    {
        DB::beginTransaction();
        
        try {
            // Buscamos los tickets asociados a la compra directamente
            $tickets = Ticket::where('id_compra', $id)->with('stock')->get();
            
            if ($tickets->isEmpty()) {
                return response()->json(['error' => 'No se encontraron tickets para esta venta'], 404);
            }
            
            // Obtenemos la compra para verificar su estado
            $compra = Compra::findOrFail($id);
            
            if ($compra->estado === 'completada') {
                return response()->json([
                    'message' => 'Esta venta ya está completada',
                    'compra_estado' => $compra->estado
                ], 400);
            }
            
            if ($compra->estado === 'cancelada') {
                return response()->json([
                    'error' => 'No se puede completar una venta cancelada',
                    'compra_estado' => $compra->estado
                ], 400);
            }
            
            // Reducir stock para cada ticket
            $stockActualizado = [];
            foreach ($tickets as $ticket) {
                if (!$ticket->stock) continue;
                
                $stock = Stock::where('id', $ticket->id_stock)
                              ->lockForUpdate()
                              ->first();
                
                if (!$stock) {
                    throw new \Exception("No se encontró stock para el ticket ID {$ticket->id}");
                }
                
                if ($stock->stock < $ticket->cantidad) {
                    throw new \Exception("Stock insuficiente para el producto en el ticket ID {$ticket->id}");
                }
                
                $stockAnterior = $stock->stock;
                $stock->stock -= $ticket->cantidad;
                $stock->save();
                
                // Guardar información sobre el stock actualizado
                $stockActualizado[] = [
                    'producto' => $stock->producto->nombre ?? 'Producto #'.$stock->id_producto,
                    'stock_anterior' => $stockAnterior,
                    'stock_actual' => $stock->stock,
                    'unidades_reducidas' => $ticket->cantidad
                ];
                
                // Actualizar estado del ticket
                $ticket->estado = 'completada';
                $ticket->save();
            }
            
            // Actualizar estado de la compra
            $estadoAnterior = $compra->estado;
            $compra->estado = 'completada';
            $compra->save();
            
            // Log para depuración
            Log::info("Venta ID {$id} completada. Estado cambiado de '{$estadoAnterior}' a '{$compra->estado}'");
            
            DB::commit();
            
            return response()->json([
                'message' => 'Venta completada y stock actualizado exitosamente',
                'compra_estado' => $compra->estado,
                'compra_id' => $compra->id,
                'stock_actualizado' => $stockActualizado
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al completar venta: ' . $e->getMessage());
            return response()->json(['error' => 'Error al completar la venta: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Cancelar una venta
     */
    public function cancelar($id)
    {
        DB::beginTransaction();
        
        try {
            // Buscamos los tickets asociados a la compra directamente
            $tickets = Ticket::where('id_compra', $id)->get();
            
            if ($tickets->isEmpty()) {
                return response()->json(['error' => 'No se encontraron tickets para esta venta'], 404);
            }
            
            // Obtenemos la compra para verificar su estado
            $compra = Compra::findOrFail($id);
            
            if ($compra->estado === 'completada') {
                return response()->json([
                    'error' => 'No se puede cancelar una venta ya completada',
                    'compra_estado' => $compra->estado
                ], 400);
            }
            
            if ($compra->estado === 'cancelada') {
                return response()->json([
                    'message' => 'Esta venta ya está cancelada',
                    'compra_estado' => $compra->estado
                ], 400);
            }
            
            // Actualizar estado de cada ticket
            foreach ($tickets as $ticket) {
                $ticket->estado = 'cancelada';
                $ticket->save();
            }
            
            // Actualizar estado de la compra
            $estadoAnterior = $compra->estado;
            $compra->estado = 'cancelada';
            $compra->save();
            
            // Log para depuración
            Log::info("Venta ID {$id} cancelada. Estado cambiado de '{$estadoAnterior}' a '{$compra->estado}'");
            
            DB::commit();
            
            return response()->json([
                'message' => 'Venta cancelada exitosamente',
                'compra_estado' => $compra->estado,
                'compra_id' => $compra->id
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al cancelar venta: ' . $e->getMessage());
            return response()->json(['error' => 'Error al cancelar la venta: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Obtener detalles de una venta específica
     */
    public function show($id)
    {
        try {
            // Buscamos los tickets asociados a la compra directamente
            $tickets = Ticket::where('id_compra', $id)
                ->with(['stock.producto'])
                ->get();
            
            if ($tickets->isEmpty()) {
                return response()->json(['error' => 'No se encontraron tickets para esta venta'], 404);
            }
            
            // Obtenemos la compra para los datos generales
            $compra = Compra::with('usuario')->findOrFail($id);
            
            // Formatear fecha de manera segura - MODIFICADO
            $fechaFormateada = null;
            if ($compra->created_at) {
                try {
                    // Usar la fecha original tal cual está en la base de datos
                    $fechaFormateada = $compra->created_at->format('Y-m-d H:i:s');
                } catch (\Exception $e) {
                    // Usar un valor fijo en lugar de la fecha actual
                    $fechaFormateada = 'Sin fecha';
                }
            } else {
                // Usar un valor fijo en lugar de la fecha actual
                $fechaFormateada = 'Sin fecha';
            }
            
            $productos = $tickets->map(function ($ticket) {
                if (!$ticket->stock || !$ticket->stock->producto) {
                    return null;
                }
                
                $producto = $ticket->stock->producto;
                return [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'talla' => $ticket->stock->talla,
                    'color' => $ticket->stock->color,
                    'cantidad' => $ticket->cantidad,
                    'precio_unitario' => $ticket->precio_unitario,
                ];
            })->filter()->values();
            
            // Calcular precio total
            $precioTotal = $tickets->sum('precio_total');
            
            $ventaFormateada = [
                'id' => $compra->id,
                'fecha' => $fechaFormateada,
                'estado' => $compra->estado ?? 'pendiente',
                'cliente' => [
                    'id' => $compra->usuario->id,
                    'nombre' => $compra->usuario->name,
                    'apellidos' => $compra->usuario->apellidos ?? '',
                ],
                'productos' => $productos,
                'precio_total' => $precioTotal,
            ];
            
            return response()->json($ventaFormateada);
            
        } catch (\Exception $e) {
            Log::error('Error al obtener detalles de venta: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener los detalles de la venta: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Obtener estadísticas de ventas
     */
    public function estadisticas()
    {
        try {
            // Ventas de hoy - consultando directamente los tickets
            $hoy = Carbon::today();
            $ventasHoy = Ticket::whereDate('created_at', $hoy)
                ->where('estado', 'completada')
                ->sum('precio_total');
            
            // Ventas de esta semana
            $inicioSemana = Carbon::now()->startOfWeek();
            $finSemana = Carbon::now()->endOfWeek();
            $ventasSemana = Ticket::whereBetween('created_at', [$inicioSemana, $finSemana])
                ->where('estado', 'completada')
                ->sum('precio_total');
            
            // Ventas de este mes
            $inicioMes = Carbon::now()->startOfMonth();
            $finMes = Carbon::now()->endOfMonth();
            $ventasMes = Ticket::whereBetween('created_at', [$inicioMes, $finMes])
                ->where('estado', 'completada')
                ->sum('precio_total');
            
            // Total de ventas
            $totalVentas = Ticket::where('estado', 'completada')->sum('precio_total');
            
            // Tickets por estado
            $ticketsCompletados = Ticket::where('estado', 'completada')->count();
            $ticketsPendientes = Ticket::where('estado', 'pendiente')->count();
            $ticketsCancelados = Ticket::where('estado', 'cancelada')->count();
            
            // Compras por estado (agrupando tickets)
            $comprasCompletadas = Ticket::where('estado', 'completada')
                ->select('id_compra')
                ->distinct()
                ->count();
                
            $comprasPendientes = Ticket::where('estado', 'pendiente')
                ->select('id_compra')
                ->distinct()
                ->count();
                
            $comprasCanceladas = Ticket::where('estado', 'cancelada')
                ->select('id_compra')
                ->distinct()
                ->count();
            
            $ventasPorEstado = [
                ['estado' => 'completada', 'total' => $comprasCompletadas],
                ['estado' => 'pendiente', 'total' => $comprasPendientes],
                ['estado' => 'cancelada', 'total' => $comprasCanceladas],
            ];
            
            return response()->json([
                'ventas_hoy' => $ventasHoy,
                'ventas_semana' => $ventasSemana,
                'ventas_mes' => $ventasMes,
                'total_ventas' => $totalVentas,
                'tickets_por_estado' => [
                    'completados' => $ticketsCompletados,
                    'pendientes' => $ticketsPendientes,
                    'cancelados' => $ticketsCancelados,
                ],
                'compras_por_estado' => $ventasPorEstado
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener estadísticas de ventas: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar una venta
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        
        try {
            // Obtenemos la compra para verificar su estado
            $compra = Compra::findOrFail($id);
            
            // Si la venta está completada, verificar si se puede eliminar
            if ($compra->estado === 'completada') {
                // Descomenta esta línea si no quieres permitir la eliminación de ventas completadas
                // return response()->json(['error' => 'No se puede eliminar una venta completada'], 400);
            }
            
            // Eliminar tickets asociados
            Ticket::where('id_compra', $id)->delete();
            
            // Eliminar la compra
            $compra->delete();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Venta eliminada exitosamente',
                'id' => $id
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al eliminar venta: ' . $e->getMessage());
            return response()->json(['error' => 'Error al eliminar la venta: ' . $e->getMessage()], 500);
        }
    }

    public function getVentasByUsuarioId($id_usuario)
{
    try {
        // Buscamos todas las compras del usuario
        $compras = Compra::where('id_usuario', $id_usuario)
                    ->orderBy('created_at', 'desc')
                    ->get();
        
        if ($compras->isEmpty()) {
            return response()->json(['message' => 'No se encontraron ventas para este usuario'], 404);
        }
        
        $ventasFormateadas = [];
        
        foreach ($compras as $compra) {
            // Buscar tickets asociados a esta compra
            $tickets = Ticket::where('id_compra', $compra->id)
                        ->with(['stock.producto'])
                        ->get();
            
            if ($tickets->isEmpty()) {
                continue; // Saltamos compras sin tickets
            }
            
            // Formatear fecha
            $fechaFormateada = $compra->created_at ? 
                              $compra->created_at->format('Y-m-d H:i:s') : 
                              'Sin fecha';
            
            // Formatear productos
            $productos = [];
            $precioTotal = 0;
            
            foreach ($tickets as $ticket) {
                if (!$ticket->stock || !$ticket->stock->producto) continue;
                
                $producto = $ticket->stock->producto;
                $productos[] = [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'talla' => $ticket->stock->talla,
                    'color' => $ticket->stock->color,
                    'cantidad' => $ticket->cantidad,
                    'precio_unitario' => $ticket->precio_unitario,
                    'subtotal' => $ticket->precio_total
                ];
                
                $precioTotal += $ticket->precio_total;
            }
            
            // Solo añadimos ventas que tienen productos
            if (!empty($productos)) {
                $ventasFormateadas[] = [
                    'id' => $compra->id,
                    'fecha' => $fechaFormateada,
                    'estado' => $compra->estado ?? 'pendiente',
                    'productos' => $productos,
                    'precio_total' => $precioTotal,
                ];
            }
        }
        
        return response()->json($ventasFormateadas);
        
    } catch (\Exception $e) {
        Log::error('Error al obtener ventas del usuario: ' . $e->getMessage());
        return response()->json(['error' => 'Error al obtener las ventas: ' . $e->getMessage()], 500);
    }
}
}