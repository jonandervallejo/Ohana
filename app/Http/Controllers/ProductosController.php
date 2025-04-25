<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ProductosController extends Controller
{
    /**
     * Devuelve todos los productos con su categoría
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $productos = Producto::with('categoria')->get();
        return response()->json($productos);
    }

    /**
     * Obtener imágenes de productos para mostrar en el carrusel
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerImagenes(Request $request)
    {
        try {
            // Opción para limitar el número de productos
            $limite = $request->query('limite', null);
            
            // Consulta base
            $query = Producto::select('id', 'nombre', 'imagen', 'precio')
                ->orderBy('created_at', 'desc'); // Los más recientes primero
                
            // Aplicar límite si se proporciona
            if ($limite) {
                $query->limit($limite);
            }
            
            $imagenes = $query->get();
            
            // Transformar las URLs de las imágenes para incluir la ruta completa
            $imagenes->transform(function ($producto) {
                $producto->imagen = asset('storage/' . $producto->imagen);
                // Formatear el precio para la app
                if (isset($producto->precio)) {
                    $producto->precio_formateado = number_format($producto->precio, 2) . ' €';
                }
                return $producto;
            });
            
            return response()->json($imagenes);
        } 
        catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener imágenes de productos',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}