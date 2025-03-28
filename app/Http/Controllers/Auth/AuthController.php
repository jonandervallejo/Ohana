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
            
            // Verificar que no sea cliente (id_rol = 3)
            if ($usuario->id_rol == 3) {
                Auth::logout();
                return response()->json([
                    'message' => 'Los clientes no tienen acceso a este sistema. Por favor, utilice la aplicación para clientes.'
                ], 403);
            }
            
            $token = $usuario->createToken('LaravelAuthApp')->plainTextToken;
            return response()->json(['token' => $token, 'usuario' => $usuario], 200);
        } else {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }
    }

    public function user(Request $request)
    {
        $usuario = Auth::user();
        
        // Verificar que no sea cliente (id_rol = 3)
        if ($usuario->id_rol == 3) {
            Auth::logout();
            $request->user()->currentAccessToken()->delete();
            return response()->json([
                'message' => 'Los clientes no tienen acceso a este sistema.'
            ], 403);
        }
        
        return response()->json($usuario);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }
}