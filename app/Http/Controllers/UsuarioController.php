<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Routing\Controller as BaseController;

class UsuarioController extends BaseController
{
    // Constantes de roles
    const ROLE_ADMIN = 1;
    const ROLE_TECNICO = 2;
    const ROLE_CLIENTE = 3;
    
    /**
     * Mostrar todos los usuarios (administradores y técnicos, excluyendo clientes)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Verificación adicional de autenticación
            if (!$user) {
                Log::warning('Acceso no autenticado rechazado', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->header('User-Agent')
                ]);
                return response()->json(['message' => 'Acceso no autorizado'], 401);
            }
            
            Log::info('Solicitud de lista de usuarios', [
                'user_id' => $user->id,
                'user_role' => $user->id_rol,
                'ip' => $request->ip()
            ]);
            
            // Solo administradores y técnicos pueden acceder a la lista
            if (!in_array($user->id_rol, [self::ROLE_ADMIN, self::ROLE_TECNICO])) {
                return response()->json(['message' => 'Acceso no autorizado por rol'], 403);
            }
            
            // Si es admin, puede ver admin y técnicos
            if ($user->id_rol == self::ROLE_ADMIN) {
                $usuarios = Usuario::whereIn('id_rol', [self::ROLE_ADMIN, self::ROLE_TECNICO])->get();
            } else {
                // Si es técnico, solo ve a otros técnicos y a sí mismo
                $usuarios = Usuario::where(function($query) use ($user) {
                    $query->where('id_rol', self::ROLE_TECNICO)
                          ->orWhere('id', $user->id);
                })->get();
            }
            
            Log::info('Usuarios recuperados con éxito', ['count' => count($usuarios)]);
            
            return response()->json($usuarios);
        } catch (\Exception $e) {
            Log::error('Error al listar usuarios', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error al procesar la solicitud',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Contar clientes para estadísticas
     * Este método es público, no requiere autenticación
     */
    public function contarClientes()
    {
        $clientesCount = Usuario::where('id_rol', 3)->count();
        return response()->json(['total_clientes' => $clientesCount]);
    }

    /**
     * Guardar un nuevo usuario (admin o técnico)
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();
            
            // Verificación adicional de autenticación
            if (!$user) {
                return response()->json(['message' => 'No autorizado'], 401);
            }
            
            // Solo admins pueden crear usuarios
            if ($user->id_rol != self::ROLE_ADMIN) {
                Log::warning('Intento no autorizado de crear usuario', [
                    'user_id' => $user->id,
                    'user_role' => $user->id_rol
                ]);
                return response()->json(['message' => 'No autorizado para crear usuarios'], 403);
            }

            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:255',
                'apellidos' => 'nullable|string|max:255',
                'email' => 'required|string|email|max:255|unique:usuario',
                'password' => 'required|string|min:6',
                'id_rol' => 'required|integer|in:1,2', // Solo admin(1) y técnico(2)
                'telefono' => 'nullable|string|max:20',
                // Quitamos validación de 'activo' ya que no existe en BD
            ]);

            if ($validator->fails()) {
                return response()->json(['message' => $validator->errors()->first()], 422);
            }

            $usuario = new Usuario([
                'nombre' => $request->nombre,
                'apellidos' => $request->apellidos ?? '',
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'id_rol' => $request->id_rol,
                'telefono' => $request->telefono ?? null,
                // Quitamos 'activo' ya que no existe en BD
            ]);

            $usuario->save();
            
            Log::info('Usuario creado correctamente', [
                'created_by' => $user->id,
                'new_user_id' => $usuario->id, 
                'new_user_email' => $usuario->email,
                'new_user_role' => $usuario->id_rol
            ]);

            return response()->json($usuario, 201);
        } catch (\Exception $e) {
            Log::error('Error al crear usuario', [
                'error' => $e->getMessage(),
                'datos' => $request->except('password')
            ]);
            return response()->json(['message' => 'Error al crear usuario: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Mostrar un usuario específico
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Verificación adicional de autenticación
            if (!$user) {
                return response()->json(['message' => 'No autorizado'], 401);
            }
            
            $usuario = Usuario::find($id);
            
            if (!$usuario) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }
            
            // Solo admins pueden ver cualquier usuario
            // Los técnicos solo pueden verse a sí mismos o a otros técnicos
            if ($user->id_rol != self::ROLE_ADMIN && 
                ($usuario->id_rol == self::ROLE_ADMIN || 
                ($user->id != $usuario->id && $usuario->id_rol != self::ROLE_TECNICO))) {
                
                Log::warning('Acceso denegado a usuario', [
                    'user_id' => $user->id,
                    'requested_user_id' => $id
                ]);
                
                return response()->json(['message' => 'Acceso no autorizado'], 403);
            }
            
            return response()->json($usuario);
        } catch (\Exception $e) {
            Log::error('Error al obtener usuario', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => 'Error al obtener usuario: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar un usuario existente
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Verificación adicional de autenticación
            if (!$user) {
                return response()->json(['message' => 'No autorizado'], 401);
            }
            
            $usuario = Usuario::find($id);
            
            if (!$usuario) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }
            
            // Verificar permisos
            $esPropioUsuario = $user->id == $usuario->id;
            
            // Solo admins pueden modificar otros usuarios
            // Y técnicos solo pueden modificarse a sí mismos
            if ($user->id_rol != self::ROLE_ADMIN && !$esPropioUsuario) {
                Log::warning('Intento no autorizado de modificar usuario', [
                    'user_id' => $user->id,
                    'target_user_id' => $id
                ]);
                return response()->json(['message' => 'No autorizado para modificar este usuario'], 403);
            }
            
            // Si no es admin, no puede cambiar su rol
            if ($user->id_rol != self::ROLE_ADMIN && $request->has('id_rol') && $request->id_rol != $user->id_rol) {
                return response()->json(['message' => 'No autorizado para cambiar el rol'], 403);
            }
            
            // Validaciones
            $rules = [
                'nombre' => 'sometimes|string|max:255',
                'apellidos' => 'nullable|string|max:255',
                'email' => [
                    'sometimes', 
                    'string', 
                    'email', 
                    'max:255', 
                    Rule::unique('usuario')->ignore($id)
                ],
                'telefono' => 'nullable|string|max:20',
            ];
            
            // Si hay contraseña, validarla
            if ($request->filled('password')) {
                $rules['password'] = 'string|min:6';
            }
            
            // Solo admins pueden cambiar roles y solo a admin(1) o técnico(2)
            if ($user->id_rol == self::ROLE_ADMIN && $request->has('id_rol')) {
                $rules['id_rol'] = 'integer|in:1,2';
            }
            
            $validator = Validator::make($request->all(), $rules);
            
            if ($validator->fails()) {
                return response()->json(['message' => $validator->errors()->first()], 422);
            }
            
            // Actualizar campos
            if ($request->filled('nombre')) {
                $usuario->nombre = $request->nombre;
            }
            
            if ($request->has('apellidos')) {
                $usuario->apellidos = $request->apellidos;
            }
            
            if ($request->filled('email')) {
                $usuario->email = $request->email;
            }
            
            if ($request->filled('password')) {
                $usuario->password = Hash::make($request->password);
            }
            
            if ($user->id_rol == self::ROLE_ADMIN && $request->has('id_rol')) {
                $usuario->id_rol = $request->id_rol;
            }
            
            if ($request->has('telefono')) {
                $usuario->telefono = $request->telefono;
            }
            
            // Quitamos la actualización del campo 'activo' ya que no existe en BD
            
            $usuario->save();
            
            Log::info('Usuario actualizado correctamente', [
                'updated_by' => $user->id,
                'user_id' => $usuario->id
            ]);
            
            return response()->json($usuario);
        } catch (\Exception $e) {
            Log::error('Error al actualizar usuario', [
                'id' => $id,
                'error' => $e->getMessage(),
                'datos' => $request->except('password')
            ]);
            return response()->json(['message' => 'Error al actualizar usuario: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar un usuario
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Verificación adicional de autenticación
            if (!$user) {
                return response()->json(['message' => 'No autorizado'], 401);
            }
            
            // Solo admins pueden eliminar usuarios
            if ($user->id_rol != self::ROLE_ADMIN) {
                Log::warning('Intento no autorizado de eliminar usuario', [
                    'user_id' => $user->id,
                    'target_user_id' => $id
                ]);
                return response()->json(['message' => 'No autorizado para eliminar usuarios'], 403);
            }
            
            $usuario = Usuario::find($id);
            
            if (!$usuario) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }
            
            // No permitir eliminar el propio usuario
            if ($user->id == $usuario->id) {
                return response()->json(['message' => 'No puede eliminar su propio usuario'], 400);
            }
            
            // No permitir eliminar al último administrador
            if ($usuario->id_rol == self::ROLE_ADMIN) {
                $adminCount = Usuario::where('id_rol', self::ROLE_ADMIN)->count();
                if ($adminCount <= 1) {
                    return response()->json(['message' => 'No puede eliminar al único administrador'], 400);
                }
            }
            
            $usuario->delete();
            
            Log::info('Usuario eliminado correctamente', [
                'deleted_by' => $user->id,
                'deleted_user_id' => $id
            ]);
            
            return response()->json(['message' => 'Usuario eliminado correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al eliminar usuario', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => 'Error al eliminar usuario: ' . $e->getMessage()], 500);
        }
    }
}