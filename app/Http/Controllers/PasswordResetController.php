<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use App\Mail\PasswordResetMail;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Enviar enlace para restablecer contraseña
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendResetLinkEmail(Request $request)
    {
        // Validar el correo electrónico
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'No existe ninguna cuenta con este correo electrónico'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Correo electrónico no registrado',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            // Generar token único
            $token = Str::random(60);
            
            // Almacenar token en la tabla password_resets
            PasswordReset::updateOrCreate(
                ['email' => $request->email],
                [
                    'email' => $request->email,
                    'token' => $token,
                    'created_at' => Carbon::now()
                ]
            );
            
            // Obtener el usuario
            $user = User::where('email', $request->email)->first();
            
            // Construir URL para la app móvil (asegúrate de que es accesible desde la app)
            $resetUrl = env('FRONTEND_URL', 'https://ohanatienda.ddns.net') . 
                        '/reset-password?token=' . $token . 
                        '&email=' . urlencode($request->email);
            
            // Enviar correo con enlace de recuperación
            Mail::to($request->email)->send(new PasswordResetMail($user, $resetUrl));
            
            return response()->json([
                'success' => true,
                'message' => 'Se ha enviado un enlace de recuperación a tu correo electrónico'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ha ocurrido un error al procesar tu solicitud',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar si un token es válido
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'valid' => false,
                'message' => 'Parámetros inválidos'
            ], 422);
        }
        
        // Buscar token en la base de datos
        $passwordReset = PasswordReset::where('email', $request->email)
                                      ->where('token', $request->token)
                                      ->first();
                                      
        if (!$passwordReset) {
            return response()->json([
                'valid' => false,
                'message' => 'Token inválido'
            ], 404);
        }
        
        // Verificar si el token no ha expirado (24 horas)
        $createdAt = Carbon::parse($passwordReset->created_at);
        if (Carbon::now()->diffInHours($createdAt) > 24) {
            return response()->json([
                'valid' => false,
                'message' => 'El token ha expirado'
            ], 404);
        }
        
        return response()->json([
            'valid' => true,
            'message' => 'Token válido'
        ]);
    }

    /**
     * Restablecer la contraseña
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reset(Request $request)
    {
        // Validar datos
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Verificar token
        $passwordReset = PasswordReset::where('email', $request->email)
                                      ->where('token', $request->token)
                                      ->first();
                                      
        if (!$passwordReset) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido'
            ], 404);
        }
        
        // Verificar expiración
        $createdAt = Carbon::parse($passwordReset->created_at);
        if (Carbon::now()->diffInHours($createdAt) > 24) {
            return response()->json([
                'success' => false,
                'message' => 'El token ha expirado'
            ], 404);
        }
        
        // Actualizar contraseña del usuario
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        $user->password = bcrypt($request->password);
        $user->save();
        
        // Eliminar token usado
        $passwordReset->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Contraseña restablecida correctamente'
        ]);
    }
}