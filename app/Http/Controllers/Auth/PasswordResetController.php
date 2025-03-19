<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use App\Models\Usuario;  // Importa el modelo Usuario
use App\Mail\ResetPasswordMail; // Importa la clase Mailable
use Illuminate\Support\Facades\Mail;

class PasswordResetController extends Controller
{
    public function sendResetLinkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'El correo electrónico es requerido y debe ser válido.'], 422);
        }

        // Cambié 'User' por 'Usuario' para usar la tabla 'usuarios'
        $user = Usuario::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'No se encontró un usuario con ese correo.'], 404);
        }

        $token = Password::getRepository()->create($user);

        // Enviar correo personalizado
        Mail::to($request->email)->send(new ResetPasswordMail($token, $request->email));

        return response()->json(['message' => 'Se ha enviado un correo con las instrucciones.']);
    }

    public function reset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
            'token' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos.'], 422);
        }

        $response = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = bcrypt($password);
                $user->save();
            }
        );

        if ($response == Password::PASSWORD_RESET) {
            return response()->json(['message' => 'La contraseña ha sido restablecida.']);
        } else {
            return response()->json(['message' => 'No se pudo restablecer la contraseña.'], 500);
        }
    }
}
