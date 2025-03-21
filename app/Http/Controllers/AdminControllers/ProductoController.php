<?php

namespace App\Http\Controllers\AdminControllers;

use App\Models\Producto;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class ProductoController extends Controller
{
    /**
     * Obtener todos los productos.
     */
    public function index()
    {
        $productos = Producto::with(['categoria', 'stocks'])->get();
        
        return response()->json($productos);
    }

    /**
     * Obtener un producto específico por ID.
     */
    public function show($id)
    {
        $producto = Producto::with(['categoria', 'stocks'])->find($id);

        if (!$producto) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        return response()->json($producto);
    }

    /**
     * Filtrar productos por categoría.
     */
    public function productosPorCategoria($id_categoria)
    {
        $productos = Producto::with(['categoria', 'stocks'])
                    ->where('id_categoria', $id_categoria)
                    ->get();

        return response()->json($productos);
    }

    /**
     * Crear un nuevo producto con imagen.
     */
    public function store(Request $request)
    {
        // Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'precio' => 'required|numeric|min:0',
            'id_categoria' => 'required|exists:categoria,id',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Validación para archivo
            'tipo' => 'nullable|string|max:100',
            'talla' => 'nullable|string|max:20',
            'imagenes' => 'nullable|json',
        ]);

        // Si la validación falla, retornar errores
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Preparar datos del producto
        $productData = $request->except('imagen_file');
        
        // Procesar la imagen si se ha subido
        if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
            $file = $request->file('imagen');
            $fileName = time() . '_' . $file->getClientOriginalName();
            
            // Crear directorio si no existe
            $uploadPath = public_path('uploads/productos');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }
            
            // Guardar archivo
            $file->move($uploadPath, $fileName);
            
            // Guardar la ruta relativa en la base de datos
            $productData['imagen'] = 'uploads/productos/' . $fileName;
        }

        // Crear el producto
        $producto = Producto::create($productData);

        // Cargar la relación de categoría y stocks para devolverla
        $producto->load(['categoria', 'stocks']);

        return response()->json($producto, 201);
    }

    /**
     * Actualizar un producto existente.
     */
    public function update(Request $request, $id)
    {
        // Buscar el producto a actualizar
        $producto = Producto::find($id);

        if (!$producto) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Validar los datos
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'sometimes|required|string',
            'precio' => 'sometimes|required|numeric|min:0',
            'id_categoria' => 'sometimes|required|exists:categoria,id',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'tipo' => 'nullable|string|max:100',
            'talla' => 'nullable|string|max:20',
            'imagenes' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Preparar datos para actualizar
        $productData = $request->except('imagen');
        
        // Procesar nueva imagen si se ha subido
        if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
            $file = $request->file('imagen');
            $fileName = time() . '_' . $file->getClientOriginalName();
            
            // Crear directorio si no existe
            $uploadPath = public_path('uploads/productos');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }
            
            // Eliminar imagen anterior si existe
            if ($producto->imagen && file_exists(public_path($producto->imagen))) {
                unlink(public_path($producto->imagen));
            }
            
            // Guardar nueva imagen
            $file->move($uploadPath, $fileName);
            
            // Actualizar ruta en datos
            $productData['imagen'] = 'uploads/productos/' . $fileName;
        }

        // Actualizar el producto
        $producto->update($productData);
        
        // Cargar la relación de categoría y stocks
        $producto->load(['categoria', 'stocks']);

        return response()->json($producto);
    }

    /**
     * Eliminar un producto.
     */
    public function destroy($id)
    {
        $producto = Producto::find($id);

        if (!$producto) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Eliminar el producto
        $producto->delete();

        return response()->json(['message' => 'Producto eliminado correctamente']);
    }

    /**
     * Obtener el total de productos
     */
    public function getTotalProductos()
    {
        $totalProductos = Producto::count();
        return response()->json(['totalProductos' => $totalProductos]);
    }
    
    /**
     * Obtener productos con stock bajo.
     */
    public function getProductosBajoStock($limite = 5)
    {
        $productos = Producto::with(['categoria', 'stocks'])
                    ->whereHas('stocks', function($query) use ($limite) {
                        $query->where('stock', '<=', $limite);
                    })
                    ->get();
                    
        return response()->json($productos);
    }
    
    /**
     * Actualizar el stock de un producto
     */
    public function actualizarStock(Request $request, $id_producto)
    {
        $validator = Validator::make($request->all(), [
            'talla' => 'required|string|max:20',
            'color' => 'required|string|max:50',
            'stock' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Buscar si existe el registro de stock
        $stock = Stock::where('id_producto', $id_producto)
                ->where('talla', $request->talla)
                ->where('color', $request->color)
                ->first();

        if ($stock) {
            // Actualizar stock existente
            $stock->update(['stock' => $request->stock]);
        } else {
            // Crear nuevo registro de stock
            $stock = Stock::create([
                'id_producto' => $id_producto,
                'talla' => $request->talla,
                'color' => $request->color,
                'stock' => $request->stock
            ]);
        }

        // Devolver producto actualizado con todos sus stocks
        $producto = Producto::with(['categoria', 'stocks'])->find($id_producto);
        
        return response()->json($producto);
    }
}