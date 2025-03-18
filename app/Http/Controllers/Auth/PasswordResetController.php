<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;

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

        $response = Password::sendResetLink($request->only('email'));

        if ($response == Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Se ha enviado un correo con las instrucciones.']);
        } else {
            return response()->json(['message' => 'No se pudo enviar el correo de restablecimiento.'], 500);
        }
    }
}