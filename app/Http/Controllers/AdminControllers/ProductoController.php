<?php
// filepath: /home/jonander/Ohana/app/Http/Controllers/AdminControllers/ProductoController.php
namespace App\Http\Controllers\AdminControllers;

use App\Models\Producto;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL; // Añadido para generar URLs absolutas

class ProductoController extends Controller
{
    /**
     * Genera una URL absoluta con HTTPS para una ruta dada
     * 
     * @param string|null $path
     * @return string|null
     */
    private function getAbsoluteUrl($path)
{
    if (!$path) return null;
    
    // Si ya es una URL completa
    if (Str::startsWith($path, ['http://', 'https://'])) {
        // Reemplazar cualquier URL local con el dominio de producción
        if (Str::contains($path, ['localhost', '127.0.0.1'])) {
            $path = preg_replace(
                '#https?://(localhost|127\.0\.0\.1)(:\d+)?#', 
                'https://ohanatienda.ddns.net', 
                $path
            );
        }
        
        // Convertir a HTTPS si es HTTP
        return str_replace('http://', 'https://', $path);
    }
    
    // Quitar slash inicial si existe
    if (Str::startsWith($path, '/')) {
        $path = substr($path, 1);
    }
    
    // Generar URL absoluta con HTTPS
    return 'https://ohanatienda.ddns.net/' . $path;
}

    /**
     * Transform product images to standardized format with absolute URLs
     */
    private function transformImageData($imageJson)
    {
        if (!$imageJson) return [];
        
        $imagenes = json_decode($imageJson, true) ?: [];
        $rutasObjetos = [];
        
        if (is_array($imagenes) && isset($imagenes[0]) && is_array($imagenes[0])) {
            foreach ($imagenes as $index => $img) {
                if (isset($img['ruta'])) {
                    $rutaCompleta = $this->getAbsoluteUrl($img['ruta']);
                    $rutasObjetos[] = [
                        'id' => 'carousel-' . $index,
                        'ruta' => $rutaCompleta,
                        'orden' => $img['orden'] ?? $index
                    ];
                }
            }
        } else {
            foreach ($imagenes as $index => $ruta) {
                $rutaCompleta = $this->getAbsoluteUrl('uploads/productos/carrusel/' . $ruta);
                $rutasObjetos[] = [
                    'id' => 'carousel-' . $index,
                    'ruta' => $rutaCompleta,
                    'orden' => $index
                ];
            }
        }
        
        return $rutasObjetos;
    }
    
    /**
     * Apply image transformation to collection of products
     */
    private function transformProductImages($productos)
    {
        foreach ($productos as $producto) {
            // Convertir la imagen principal a URL absoluta con HTTPS
            if ($producto->imagen) {
                $producto->imagen = $this->getAbsoluteUrl($producto->imagen);
            }
            
            // Convertir las imágenes del carrusel
            $producto->imagenes = $this->transformImageData($producto->imagenes);
        }
        return $productos;
    }
    
    /**
     * Handle file upload
     */
    private function handleFileUpload($file, $prefix, $path)
    {
        $fileName = time() . '_' . $prefix . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $uploadPath = public_path($path);
        
        if (!file_exists($uploadPath)) mkdir($uploadPath, 0777, true);
        
        $file->move($uploadPath, $fileName);
        return $path . '/' . $fileName;
    }

    public function index(Request $request)
    {
        try {
            $query = Producto::with(['categoria', 'stocks']);
            
            // Aplicar filtros de fecha si están presentes
            if ($request->has('fecha_inicio') && !empty($request->fecha_inicio)) {
                $query->whereDate('created_at', '>=', $request->fecha_inicio);
                Log::info('Filtrando desde: ' . $request->fecha_inicio);
            }
            
            if ($request->has('fecha_fin') && !empty($request->fecha_fin)) {
                $query->whereDate('created_at', '<=', $request->fecha_fin);
                Log::info('Filtrando hasta: ' . $request->fecha_fin);
            }
            
            $limit = $request->input('per_page', 6);
            $productos = $query->paginate($limit);
            
            // Log para debugging
            Log::info('Consulta SQL productos: ' . $query->toSql());
            Log::info('Parámetros recibidos: ' . json_encode($request->all()));
            
            return response()->json($this->transformProductImages($productos));
        } catch (\Exception $e) {
            Log::error('Error en ProductoController@index: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener productos'], 500);
        }
    }

    public function show($id)
    {
        $producto = Producto::with(['categoria', 'stocks'])->find($id);
        if (!$producto) return response()->json(['error' => 'Producto no encontrado'], 404);
        
        // Transformar el producto para asegurar URLs HTTPS
        $productos = collect([$producto]);
        $productos = $this->transformProductImages($productos);
        
        return response()->json($productos[0]);
    }

    public function productosPorCategoria(Request $request, $id_categoria)
    {
        try {
            $query = Producto::with(['categoria', 'stocks'])
                ->where('id_categoria', $id_categoria);
                
            // Aplicar filtros de fecha si están presentes
            if ($request->has('fecha_inicio') && !empty($request->fecha_inicio)) {
                $query->whereDate('created_at', '>=', $request->fecha_inicio);
                Log::info('Filtrando por categoría desde: ' . $request->fecha_inicio);
            }
            
            if ($request->has('fecha_fin') && !empty($request->fecha_fin)) {
                $query->whereDate('created_at', '<=', $request->fecha_fin);
                Log::info('Filtrando por categoría hasta: ' . $request->fecha_fin);
            }
            
            $limit = $request->input('per_page', 6);
            $productos = $query->paginate($limit);
            
            // Log para debugging
            Log::info('Consulta SQL productos por categoría: ' . $query->toSql());
            Log::info('Categoría: ' . $id_categoria);
                
            return response()->json($this->transformProductImages($productos));
        } catch (\Exception $e) {
            Log::error('Error en ProductoController@productosPorCategoria: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener productos por categoría'], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'precio' => 'required|numeric|min:0',
            'id_categoria' => 'required|exists:categoria,id',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'imagenes_files.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'tipo' => 'nullable|string|max:100',
            'talla' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $productData = $request->except(['imagen', 'imagenes_files', 'imagenes']);
            
            // Procesar imagen principal
            if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
                $productData['imagen'] = $this->handleFileUpload(
                    $request->file('imagen'),
                    'principal',
                    'uploads/productos'
                );
            }
            
            // Procesar imágenes de carrusel
            $imagenesCarrusel = [];
            
            if ($request->hasFile('imagenes_files')) {
                $uploadPath = 'uploads/productos/carrusel';
                mkdir(public_path($uploadPath), 0777, true);
                
                // Obtener nombres predefinidos si existen
                $nombresPredefinidos = [];
                if ($request->has('imagenes') && !empty($request->input('imagenes'))) {
                    $nombresPredefinidos = json_decode($request->input('imagenes'), true) ?: [];
                }
                
                foreach ($request->file('imagenes_files') as $index => $file) {
                    if ($file->isValid()) {
                        $nombreGuardar = isset($nombresPredefinidos[$index]) 
                            ? $nombresPredefinidos[$index] 
                            : time() . '_carrusel_' . uniqid() . '.' . $file->getClientOriginalExtension();
                        
                        $file->move(public_path($uploadPath), $nombreGuardar);
                        
                        $imagenesCarrusel[] = [
                            'id' => Str::uuid()->toString(),
                            'ruta' => $uploadPath . '/' . $nombreGuardar,
                            'orden' => $index
                        ];
                    }
                }
                
                if (!empty($imagenesCarrusel)) {
                    $productData['imagenes'] = json_encode($imagenesCarrusel);
                }
            }
            
            $producto = Producto::create($productData);
            DB::commit();
            
            $producto->load(['categoria', 'stocks']);
            
            // Transformar el producto para URLs HTTPS
            $productos = collect([$producto]);
            $productos = $this->transformProductImages($productos);
            
            return response()->json($productos[0], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error: " . $e->getMessage());
            return response()->json(['error' => 'Error al crear el producto'], 500);
        }
    }

    public function update(Request $request, $id)
{
    $producto = Producto::find($id);
    if (!$producto) return response()->json(['error' => 'Producto no encontrado'], 404);
    
    $validator = Validator::make($request->all(), [
        'nombre' => 'sometimes|required|string|max:255',
        'descripcion' => 'sometimes|required|string',
        'precio' => 'sometimes|required|numeric|min:0',
        'id_categoria' => 'sometimes|required|exists:categoria,id',
        'imagen_principal' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        'imagenes_nuevas.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        'imagenes_eliminar' => 'nullable|array',
        'imagen_a_principal' => 'nullable|string',
        'tipo' => 'nullable|string|max:100',
        'talla' => 'nullable|string|max:20',
    ]);
    
    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }
    
    try {
        DB::beginTransaction();
        
        $productData = $request->except(['imagen_principal', 'imagenes_nuevas', 'imagenes_eliminar', 'imagenes_a_principal']);
        
        // Cargar imágenes existentes
        $imagenesCarrusel = json_decode($producto->imagenes, true) ?: [];
        
        // Convertir formato simple a objetos si es necesario
        if (!empty($imagenesCarrusel) && !is_array($imagenesCarrusel[0])) {
            $temp = [];
            foreach ($imagenesCarrusel as $index => $ruta) {
                $temp[] = [
                    'id' => uniqid(),
                    'ruta' => 'uploads/productos/carrusel/' . $ruta,
                    'orden' => $index
                ];
            }
            $imagenesCarrusel = $temp;
        }
        
        // Si hay nueva imagen principal por archivo
        if ($request->hasFile('imagen_principal') && $request->file('imagen_principal')->isValid()) {
            // Guardar la imagen anterior para intercambiarla
            $imagenAnterior = $producto->imagen;
            
            // Subir la nueva imagen principal
            $productData['imagen'] = $this->handleFileUpload(
                $request->file('imagen_principal'),
                'principal',
                'uploads/productos'
            );
            
            // Mover la imagen anterior al carrusel (verificando que no esté duplicada)
            if ($imagenAnterior && file_exists(public_path($imagenAnterior))) {
                // Limpiar la URL para obtener la ruta relativa
                $imagenAnterior = str_replace(URL::to('/'), '', $imagenAnterior);
                $imagenAnterior = ltrim($imagenAnterior, '/');
                
                // Verificar si la imagen ya existe en el carrusel
                $imagenYaExiste = false;
                foreach ($imagenesCarrusel as $img) {
                    $rutaRelativa = str_replace(URL::to('/'), '', $img['ruta']);
                    $rutaRelativa = ltrim($rutaRelativa, '/');
                    
                    if ($rutaRelativa == $imagenAnterior) {
                        $imagenYaExiste = true;
                        break;
                    }
                }
                
                // Solo agregar si no existe
                if (!$imagenYaExiste) {
                    $imagenesCarrusel[] = [
                        'id' => uniqid(),
                        'ruta' => $imagenAnterior,
                        'orden' => count($imagenesCarrusel)
                    ];
                }
            }
        }
        // Si se quiere establecer imagen del carrusel como principal
        else if ($request->has('imagen_a_principal') && !empty($request->imagen_a_principal)) {
            $rutaBuscar = $request->imagen_a_principal;
            $imagenAnterior = $producto->imagen;
            $imagenEncontradaIndex = null;
            
            // Normalizar la ruta de búsqueda eliminando la URL base si existe
            $rutaBuscar = str_replace(URL::to('/'), '', $rutaBuscar);
            $rutaBuscar = ltrim($rutaBuscar, '/');
            
            foreach ($imagenesCarrusel as $index => $img) {
                $rutaCompleta = $img['ruta'];
                // Normalizar la ruta completa
                $rutaCompletaNormalizada = str_replace(URL::to('/'), '', $rutaCompleta);
                $rutaCompletaNormalizada = ltrim($rutaCompletaNormalizada, '/');
                
                $rutaBasename = basename($rutaCompleta);
                $rutaConUploads = "uploads/productos/carrusel/{$rutaBasename}";
                
                if ($rutaBuscar == $rutaCompletaNormalizada || $rutaBuscar == $rutaBasename || $rutaBuscar == $rutaConUploads) {
                    // Establecer la imagen seleccionada como principal
                    $productData['imagen'] = $rutaCompletaNormalizada; // Guardar ruta relativa en BD
                    $imagenEncontradaIndex = $index;
                    break;
                }
            }
            
            // Intercambiar: eliminar la imagen promovida del carrusel y agregar la anterior
            if ($imagenEncontradaIndex !== null) {
                // Eliminar la imagen del carrusel
                array_splice($imagenesCarrusel, $imagenEncontradaIndex, 1);
                
                // Normalizar la ruta anterior
                $imagenAnteriorNormalizada = str_replace(URL::to('/'), '', $imagenAnterior);
                $imagenAnteriorNormalizada = ltrim($imagenAnteriorNormalizada, '/');
                
                // Agregar la imagen anterior al carrusel si existe y no está ya en el carrusel
                if ($imagenAnteriorNormalizada && file_exists(public_path($imagenAnteriorNormalizada))) {
                    $imagenYaExiste = false;
                    foreach ($imagenesCarrusel as $img) {
                        $rutaRelativa = str_replace(URL::to('/'), '', $img['ruta']);
                        $rutaRelativa = ltrim($rutaRelativa, '/');
                        
                        if ($rutaRelativa == $imagenAnteriorNormalizada) {
                            $imagenYaExiste = true;
                            break;
                        }
                    }
                    
                    if (!$imagenYaExiste) {
                        $imagenesCarrusel[] = [
                            'id' => uniqid(),
                            'ruta' => $imagenAnteriorNormalizada,
                            'orden' => count($imagenesCarrusel)
                        ];
                    }
                }
            }
        }

        // Eliminar imágenes marcadas para borrar del array (pero no físicamente)
        if ($request->has('imagenes_eliminar') && is_array($request->imagenes_eliminar)) {
            $imagenesAMantener = [];
            
            foreach ($imagenesCarrusel as $imagen) {
                $rutaCompleta = $imagen['ruta'];
                // Normalizar la ruta
                $rutaCompletaNormalizada = str_replace(URL::to('/'), '', $rutaCompleta);
                $rutaCompletaNormalizada = ltrim($rutaCompletaNormalizada, '/');
                
                $rutaBasename = basename($rutaCompleta);
                $rutaConUploads = "uploads/productos/carrusel/{$rutaBasename}";
                
                $debeEliminar = false;
                foreach ($request->imagenes_eliminar as $rutaEliminar) {
                    // Normalizar la ruta a eliminar
                    $rutaEliminarNormalizada = str_replace(URL::to('/'), '', $rutaEliminar);
                    $rutaEliminarNormalizada = ltrim($rutaEliminarNormalizada, '/');
                    
                    if ($rutaEliminarNormalizada == $rutaCompletaNormalizada || 
                        $rutaEliminarNormalizada == $rutaBasename || 
                        $rutaEliminarNormalizada == $rutaConUploads) {
                        $debeEliminar = true;
                        // No se borran las imágenes físicamente
                        break;
                    }
                }
                
                if (!$debeEliminar) {
                    $imagenesAMantener[] = $imagen;
                }
            }
            
            $imagenesCarrusel = $imagenesAMantener;
        }
        
        // Procesar nuevas imágenes
        if ($request->hasFile('imagenes_nuevas')) {
            $ultimoOrden = count($imagenesCarrusel) > 0 ? max(array_column($imagenesCarrusel, 'orden')) + 1 : 0;
            
            foreach ($request->file('imagenes_nuevas') as $file) {
                if ($file->isValid()) {
                    $fileName = $this->handleFileUpload($file, 'carrusel', 'uploads/productos/carrusel');
                    
                    $imagenesCarrusel[] = [
                        'id' => uniqid(),
                        'ruta' => $fileName, // Ruta relativa
                        'orden' => $ultimoOrden++
                    ];
                }
            }
        }
        
        // Guardar cambios
        $producto->update($productData);
        $producto->imagenes = json_encode($imagenesCarrusel);
        $producto->save();
        
        DB::commit();
        
        // Cargar las relaciones y transformar el producto para HTTPS
        $producto->load(['categoria', 'stocks']);
        $productos = collect([$producto]);
        $productos = $this->transformProductImages($productos);
        
        return response()->json(['success' => 'Producto actualizado correctamente', 'producto' => $productos[0]]);
    } catch (\Exception $e) {
        DB::rollback();
        Log::error('Error en update: ' . $e->getMessage());
        Log::error($e->getTraceAsString());
        return response()->json(['error' => 'Error al actualizar el producto'], 500);
    }
}

    public function destroy($id)
    {
        try {
            $producto = Producto::find($id);
            if (!$producto) return response()->json(['error' => 'Producto no encontrado'], 404);
            
            DB::beginTransaction();
            
            // Normalizar ruta de imagen principal
            $imagenPrincipal = str_replace(URL::to('/'), '', $producto->imagen);
            $imagenPrincipal = ltrim($imagenPrincipal, '/');
            
            // Eliminar imagen principal
            if ($imagenPrincipal && file_exists(public_path($imagenPrincipal))) {
                @unlink(public_path($imagenPrincipal));
            }
            
            // Eliminar imágenes del carrusel
            if ($producto->imagenes) {
                $imagenes = json_decode($producto->imagenes, true) ?: [];
                
                foreach ($imagenes as $imagen) {
                    $ruta = is_array($imagen) && isset($imagen['ruta']) 
                        ? $imagen['ruta'] 
                        : 'uploads/productos/carrusel/' . $imagen;
                    
                    // Normalizar ruta
                    $ruta = str_replace(URL::to('/'), '', $ruta);
                    $ruta = ltrim($ruta, '/');
                    
                    if (file_exists(public_path($ruta))) @unlink(public_path($ruta));
                }
            }
            
            $producto->delete();
            DB::commit();
            
            return response()->json(['message' => 'Producto eliminado correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en destroy: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al eliminar el producto'], 500);
        }
    }

    public function getTotalProductos()
    {
        return response()->json(['totalProductos' => Producto::count()]);
    }
    
    public function getProductosBajoStock($limite = 5)
    {
        $productos = Producto::with(['categoria', 'stocks'])
            ->whereHas('stocks', function($query) use ($limite) {
                $query->where('stock', '<=', $limite);
            })->get();
            
        return response()->json($this->transformProductImages($productos));
    }
    
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
        
        $stock = Stock::where('id_producto', $id_producto)
            ->where('talla', $request->talla)
            ->where('color', $request->color)
            ->first();
            
        if ($stock) {
            $stock->update(['stock' => $request->stock]);
        } else {
            Stock::create([
                'id_producto' => $id_producto,
                'talla' => $request->talla,
                'color' => $request->color,
                'stock' => $request->stock
            ]);
        }
        
        $producto = Producto::with(['categoria', 'stocks'])->find($id_producto);
        
        // Transformar para HTTPS
        $productos = collect([$producto]);
        $productos = $this->transformProductImages($productos);
        
        return response()->json($productos[0]);
    }

    public function obtenerProductosConStock()
    {
        try {
            // Obtener productos con sus stocks
            $productos = Producto::with(['categoria', 'stocks'])->get();
            
            // Filtrar solo productos que tienen al menos un registro de stock
            $productosConStock = $productos->filter(function ($producto) {
                return $producto->stocks->isNotEmpty();
            });
            
            // Transformar las imágenes de los productos para HTTPS
            $productosConStock = $this->transformProductImages($productosConStock->values());
            
            return response()->json($productosConStock);
        } catch (\Exception $e) {
            // Log del error para depuración
            Log::error('Error al obtener productos con stock: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            // Devolver un array vacío en caso de error
            return response()->json([]);
        }
    }

    public function getProductosPorGenero(Request $request, $genero)
    {
        try {
            // Validar que el género sea válido (ahora incluye unisex)
            if (!in_array(strtolower($genero), ['hombre', 'mujer', 'unisex'])) {
                return response()->json(['error' => 'Género no válido. Use "hombre", "mujer" o "unisex"'], 400);
            }
            
            // Normalizar el género para la consulta
            $generoNormalizado = ucfirst(strtolower($genero));
            
            // Crear la consulta base con relaciones
            $query = Producto::with(['categoria', 'stocks']);
            
            // Filtrado según el género - MODIFICADO para ser insensible a mayúsculas/minúsculas
            if ($generoNormalizado === 'Unisex') {
                $query->where(function($q) {
                    $q->whereRaw('LOWER(tipo) LIKE ?', ['%unisex%'])
                      ->orWhereRaw('LOWER(tipo) LIKE ?', ['%uni%'])
                      ->orWhereRaw('LOWER(tipo) LIKE ?', ['%ambos%']);
                });
            } else {
                // Hombre o Mujer (incluye unisex)
                $query->where(function($q) use ($generoNormalizado) {
                    $q->whereRaw('LOWER(tipo) LIKE ?', ['%'.strtolower($generoNormalizado).'%'])
                      ->orWhereRaw('LOWER(tipo) LIKE ?', ['%unisex%'])
                      ->orWhereRaw('LOWER(tipo) LIKE ?', ['%uni%'])
                      ->orWhereRaw('LOWER(tipo) LIKE ?', ['%ambos%']);
                });
            }
            
            // Aplicar filtro de búsqueda si existe
            if ($request->has('busqueda') && !empty($request->busqueda)) {
                $busqueda = $request->busqueda;
                $query->where(function($q) use ($busqueda) {
                    $q->where('nombre', 'LIKE', "%{$busqueda}%")
                    ->orWhere('descripcion', 'LIKE', "%{$busqueda}%");
                });
            }
            
            // Aplicar filtros de precio si existen
            if ($request->has('precio_min') && is_numeric($request->precio_min)) {
                $query->where('precio', '>=', $request->precio_min);
            }
            
            if ($request->has('precio_max') && is_numeric($request->precio_max)) {
                $query->where('precio', '<=', $request->precio_max);
            }
            
            // Aplicar filtro de categoría si existe
            if ($request->has('categoria') && !empty($request->categoria)) {
                $query->where('id_categoria', $request->categoria);
            }
            
            // Configurar la paginación
            $perPage = $request->input('per_page', 6);
            $productos = $query->paginate($perPage);
            
            // Transformar las imágenes para HTTPS y devolver la respuesta
            return response()->json($this->transformProductImages($productos));
            
        } catch (\Exception $e) {
            Log::error('Error en getProductosPorGenero: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al obtener productos por género'], 500);
        }
    }
     
    public function buscar(Request $request)
    {
        try {
            $query = $request->get('q', '');
            
            if (empty($query)) {
                return response()->json([]);
            }
            
            $productos = Producto::where('nombre', 'like', "%{$query}%")
                ->orWhere('descripcion', 'like', "%{$query}%")
                ->with('categoria')
                ->limit(20)
                ->get();
            
            // Transformar para HTTPS
            return response()->json($this->transformProductImages($productos));
        } catch (\Exception $e) {
            // Log del error
            \Log::error('Error en búsqueda de productos: ' . $e->getMessage());
            
            // Devolver respuesta de error controlada
            return response()->json(['error' => 'Error al buscar productos'], 500);
        }
    }
        
    /**
     * Obtener productos por IDs (para favoritos desde localStorage)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerProductosPorIds(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'ids' => 'required|array',
                'ids.*' => 'integer',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => 'IDs de productos inválidos'], 422);
            }

            $ids = $request->ids;
            
            if (empty($ids)) {
                return response()->json(['data' => []]);
            }
            
            // Obtener productos con sus relaciones  
            $productos = Producto::with(['categoria', 'stocks'])
                ->whereIn('id', $ids)
                ->get();
            
            // Transformar imágenes de productos para HTTPS
            $productosTransformados = $this->transformProductImages($productos);
            
            return response()->json([
                'data' => $productosTransformados
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener productos por IDs: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => 'Error al recuperar productos favoritos'], 500);
        }
    }
}