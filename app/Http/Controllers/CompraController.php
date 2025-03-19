<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Compra;

class CompraController extends Controller
{
    public function obtenerPedidosPendientes()
    {
        $pedidosPendientes = Compra::where('estado', 'pendiente')->count();
        return response()->json($pedidosPendientes);
    }
}