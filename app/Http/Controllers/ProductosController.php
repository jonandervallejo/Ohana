<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ProductosController extends Controller
{

    public function index()
    {
        $productos = Producto::with('categoria')->get();
        return response()->json($productos);
    }

    public function obtenerImagenes()
    {
        $imagenes = Producto::select('imagen')->get();
        return response()->json($imagenes);
    }
}