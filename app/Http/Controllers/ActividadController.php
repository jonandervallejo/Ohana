<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\Producto;
use App\Models\Actividad;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ActividadController extends Controller
{
    public function actividadReciente()
    {
        try {
            // Establecer la zona horaria para España/Madrid
            $zonaHoraria = 'Europe/Madrid';
            Carbon::setLocale('es');
            
            $actividades = [];
            
            // Obtener últimas ventas desde tickets
            $tickets = Ticket::orderBy('created_at', 'desc')
                            ->take(6)
                            ->get();
            
            foreach ($tickets as $ticket) {
                if ($ticket->created_at) {
                    // Convertir a la zona horaria local
                    $fechaLocal = Carbon::parse($ticket->created_at)->setTimezone($zonaHoraria);
                    
                    $actividades[] = [
                        'tipo' => 'venta',
                        'descripcion' => "Nueva venta - €{$ticket->precio_total}",
                        'tiempo_formateado' => $fechaLocal->format('H:i'),
                        'fecha' => $fechaLocal->format('Y-m-d'),
                        'timestamp' => $fechaLocal->timestamp
                    ];
                }
            }
            
            // Obtener actividades recientes de productos
            $productosActualizados = Producto::orderBy('updated_at', 'desc')
                              ->whereNotNull('updated_at')
                              ->take(6)
                              ->get();
                              
            foreach ($productosActualizados as $producto) {
                if ($producto->updated_at) {
                    // Convertir a la zona horaria local
                    $fechaLocal = Carbon::parse($producto->updated_at)->setTimezone($zonaHoraria);
                    
                    // Determinar si es una creación o actualización
                    $esCreacion = $producto->created_at->eq($producto->updated_at);
                    
                    $actividades[] = [
                        'tipo' => 'producto',
                        'descripcion' => $esCreacion 
                            ? "Nuevo producto: {$producto->nombre} - €{$producto->precio}" 
                            : "Producto actualizado: {$producto->nombre}",
                        'tiempo_formateado' => $fechaLocal->format('H:i'),
                        'fecha' => $fechaLocal->format('Y-m-d'),
                        'timestamp' => $fechaLocal->timestamp
                    ];
                }
            }
            
            if (class_exists('App\Models\Actividad')) {
                try {
                    $actividadesRegistradas = Actividad::where('tipo', 'producto')
                                          ->orWhere('tipo', 'stock')
                                          ->orderBy('created_at', 'desc')
                                          ->take(6)
                                          ->get();
                                          
                    foreach ($actividadesRegistradas as $actividad) {
                        if ($actividad->created_at) {
                            // Convertir a la zona horaria local
                            $fechaLocal = Carbon::parse($actividad->created_at)->setTimezone($zonaHoraria);
                            
                            $actividades[] = [
                                'tipo' => $actividad->tipo,
                                'descripcion' => $actividad->descripcion,
                                'tiempo_formateado' => $fechaLocal->format('H:i'),
                                'fecha' => $fechaLocal->format('Y-m-d'),
                                'timestamp' => $fechaLocal->timestamp
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    \Log::warning('No se pudieron obtener actividades registradas: ' . $e->getMessage());
                    // Continuar sin estas actividades
                }
            }
            
            // Ordenar todas las actividades por timestamp (más recientes primero)
            usort($actividades, function($a, $b) {
                return $b['timestamp'] - $a['timestamp'];
            });
            
            // Limitar a un número razonable de actividades
            $actividades = array_slice($actividades, 0, 5);
            
            return response()->json($actividades);
        } catch (\Exception $e) {
            // Log del error para depuración
            \Log::error('Error en actividadReciente: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            
            // Devolver un array vacío en caso de error
            return response()->json([]);
        }
    }
}