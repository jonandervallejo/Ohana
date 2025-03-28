<?php
// filepath: /home/jonander/ApiLaravel/app/Http/Controllers/UserController.php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Obtener datos del perfil del usuario actual
     */
    public function getProfile()
    {
        // Auth::user() ya está usando el modelo Usuario porque lo configuraste en config/auth.php
        $usuario = Auth::user();
        return response()->json($usuario);
    }

    /**
     * Actualizar datos del perfil
     */
    public function updateProfile(Request $request)
    {
        // Validar los datos
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'apellido1' => 'nullable|string|max:255', // Añadir validación
            'apellido2' => 'nullable|string|max:255', // Añadir validación
            'telefono' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos', 
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener usuario actual
        $usuario = Auth::user();

        // Actualizar datos
        $usuario->nombre = $request->nombre;
        
        // Actualizar apellidos explícitamente
        if ($request->has('apellido1')) {
            $usuario->apellido1 = $request->apellido1;
        }
        
        if ($request->has('apellido2')) {
            $usuario->apellido2 = $request->apellido2;
        }
        
        if ($request->has('telefono')) {
            $usuario->telefono = $request->telefono;
        }
        
        $usuario->save();

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'usuario' => $usuario
        ]);
    }


    /**
     * Cambiar contraseña
     */
    public function changePassword(Request $request)
    {
        // Validar los datos
        $validator = Validator::make($request->all(), [
            'password_actual' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos', 
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener usuario actual
        $usuario = Auth::user();

        // Verificar contraseña actual
        if (!Hash::check($request->password_actual, $usuario->password)) {
            return response()->json([
                'message' => 'La contraseña actual no es correcta'
            ], 422);
        }

        // Actualizar contraseña
        $usuario->password = Hash::make($request->password);
        $usuario->save();

        return response()->json([
            'message' => 'Contraseña actualizada correctamente'
        ]);
    }
}