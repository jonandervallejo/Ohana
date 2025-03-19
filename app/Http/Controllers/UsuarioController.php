<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    public function index()
    {
        $usuarios = Usuario::all();
        return response()->json($usuarios);
    }

    public function show($id)
    {
        $usuario = Usuario::find($id);
        if ($usuario) {
            return response()->json($usuario);
        } else {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }
    }

    public function contarClientes()
    {
        $clientesCount = Usuario::where('id_rol', 3)->count();
        return response()->json(['total_clientes' => $clientesCount]);
    }
}