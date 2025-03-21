<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Stock;
use App\Models\Producto;

class StockController extends Controller
{
    public function obtenerStock()
    {
        try {
            $productos = Producto::with('categoria', 'stocks')->get();

            $productosConStock = $productos->map(function ($producto) {
                $producto->stock = $producto->stocks->sum('stock');
                return $producto;
            });

            return response()->json($productosConStock);
        } catch (\Exception $e) {
            \Log::error('Error al obtener el stock: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener el stock'], 500);
        }
    }

    public function agregarStock(Request $request)
    {
        $request->validate([
            'productoId' => 'required|exists:producto,id',
            'talla' => 'required|string|max:255',
            'color' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
        ]);

        try {
            $stock = new Stock();
            $stock->id_producto = $request->productoId;
            $stock->talla = $request->talla;
            $stock->color = $request->color;
            $stock->stock = $request->stock;
            $stock->save();

            return response()->json(['message' => 'Stock agregado exitosamente'], 201);
        } catch (\Exception $e) {
            \Log::error('Error al agregar stock: ' . $e->getMessage());
            return response()->json(['error' => 'Error al agregar stock'], 500);
        }
    }

    public function obtenerInventarios()
{
    try {
        $inventarios = Stock::with('producto.categoria')->get();
        return response()->json($inventarios);
    } catch (\Exception $e) {
        \Log::error('Error al obtener los inventarios: ' . $e->getMessage());
        return response()->json(['error' => 'Error al obtener los inventarios'], 500);
    }
}

    public function actualizarInventario(Request $request, $id)
{
    $request->validate([
        'talla' => 'required|string|max:255',
        'color' => 'required|string|max:255',
        'stock' => 'required|integer|min:0',
    ]);

    try {
        $inventario = Stock::findOrFail($id);
        $inventario->talla = $request->talla;
        $inventario->color = $request->color;
        $inventario->stock = $request->stock;
        $inventario->save();

        return response()->json(['message' => 'Inventario actualizado exitosamente']);
    } catch (\Exception $e) {
        \Log::error('Error al actualizar inventario: ' . $e->getMessage());
        return response()->json(['error' => 'Error al actualizar inventario'], 500);
    }
}
}