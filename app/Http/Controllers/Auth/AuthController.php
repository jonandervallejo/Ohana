<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Usuario;
use App\Http\Controllers\Controller;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $usuario = Auth::user();
            $token = $usuario->createToken('LaravelAuthApp')->plainTextToken;
            return response()->json(['token' => $token, 'usuario' => $usuario], 200);
        } else {
            return response()->json(['message' => 'Contraseña incorrecta'], 401);
        }
    }

    public function user(Request $request)
    {
        return response()->json(Auth::user());
    }
}