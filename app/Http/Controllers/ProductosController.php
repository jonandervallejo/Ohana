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
            
            // Consulta base - añadido el campo 'imagenes'
            $query = Producto::select('id', 'nombre', 'imagen', 'imagenes', 'precio')
                ->orderBy('created_at', 'desc'); // Los más recientes primero
                
            // Aplicar límite si se proporciona
            if ($limite) {
                $query->limit($limite);
            }
            
            $productos = $query->get();
            
            // Transformar las URLs de las imágenes para incluir la ruta completa
            $productos->transform(function ($producto) {
                // Procesar imagen principal
                if ($producto->imagen) {
                    $producto->imagen = $producto->imagen; // Ya tiene la ruta correcta
                }
                
                // Procesar imágenes del carrusel
                if ($producto->imagenes) {
                    // Convertir JSON a array
                    $imagenesArray = json_decode($producto->imagenes, true) ?: [];
                    $imagenesTransformadas = [];
                    
                    // Si es un array simple de rutas
                    if (!empty($imagenesArray) && !is_array(reset($imagenesArray))) {
                        foreach ($imagenesArray as $index => $ruta) {
                            $imagenesTransformadas[] = [
                                'id' => 'carousel-' . $index,
                                'ruta' => 'uploads/productos/carrusel/' . $ruta,
                                'orden' => $index
                            ];
                        }
                    } 
                    // Si es un array de objetos con la estructura {id, ruta, orden}
                    else {
                        foreach ($imagenesArray as $index => $img) {
                            if (isset($img['ruta'])) {
                                $imagenesTransformadas[] = [
                                    'id' => 'carousel-' . $index,
                                    'ruta' => 'uploads/productos/carrusel/' . basename($img['ruta']),
                                    'orden' => $img['orden'] ?? $index
                                ];
                            }
                        }
                    }
                    
                    $producto->imagenes = $imagenesTransformadas;
                } else {
                    $producto->imagenes = [];
                }
                
                // Formatear el precio para la app
                if (isset($producto->precio)) {
                    $producto->precio_formateado = number_format($producto->precio, 2) . ' €';
                }
                
                return $producto;
            });
            
            return response()->json($productos);
        } 
        catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener imágenes de productos',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}