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
     * Mostrar todos los usuarios (incluyendo clientes)
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
            
            // Si es admin, puede ver todos los usuarios (admin, técnicos y clientes)
            if ($user->id_rol == self::ROLE_ADMIN) {
                $usuarios = Usuario::all();
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
        $clientesCount = Usuario::where('id_rol', self::ROLE_CLIENTE)->count();
        return response()->json(['total_clientes' => $clientesCount]);
    }

    /**
     * Obtener listado de clientes
     * Utilizado principalmente para propósitos administrativos
     */
    public function getClientes(Request $request)
    {
        try {
            $user = $request->user();
            
            // Verificación adicional de autenticación
            if (!$user) {
                return response()->json(['message' => 'Acceso no autorizado'], 401);
            }
            
            // Solo administradores pueden ver la lista completa de clientes
            if ($user->id_rol != self::ROLE_ADMIN) {
                return response()->json(['message' => 'Acceso no autorizado por rol'], 403);
            }
            
            $clientes = Usuario::where('id_rol', self::ROLE_CLIENTE)->get();
            
            return response()->json($clientes);
        } catch (\Exception $e) {
            Log::error('Error al listar clientes', [
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
     * Guardar un nuevo usuario (admin, técnico o cliente)
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
                'apellido1' => 'required|string|max:255',
                'apellido2' => 'nullable|string|max:255',
                'email' => 'required|string|email|max:255|unique:usuario',
                'password' => 'required|string|min:6',
                'id_rol' => 'required|integer|in:1,2,3', // Admin(1), técnico(2) y cliente(3)
                'telefono' => 'nullable|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json(['message' => $validator->errors()->first()], 422);
            }

            // Ensure apellido1 is not null
            $apellido1 = $request->apellido1;
            if (empty($apellido1)) {
                $apellido1 = '-'; // Default value if empty
            }

            $usuario = new Usuario([
                'nombre' => $request->nombre,
                'apellido1' => $apellido1,
                'apellido2' => $request->apellido2 ?? '',
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'id_rol' => $request->id_rol,
                'telefono' => $request->telefono ?? null,
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
     * Actualizar un usuario existente (incluidos los clientes)
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
                'apellido1' => 'sometimes|string|max:255',
                'apellido2' => 'nullable|string|max:255',
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
            
            // Solo admins pueden cambiar roles y a cualquiera de los 3 roles disponibles
            if ($user->id_rol == self::ROLE_ADMIN && $request->has('id_rol')) {
                $rules['id_rol'] = 'integer|in:1,2,3';
            }
            
            $validator = Validator::make($request->all(), $rules);
            
            if ($validator->fails()) {
                return response()->json(['message' => $validator->errors()->first()], 422);
            }
            
            // Actualizar campos
            if ($request->filled('nombre')) {
                $usuario->nombre = $request->nombre;
            }
            
            // Always set apellido1 when provided, default to - if empty
            if ($request->has('apellido1')) {
                $usuario->apellido1 = !empty($request->apellido1) ? $request->apellido1 : '-';
            }
            
            if ($request->has('apellido2')) {
                $usuario->apellido2 = $request->apellido2;
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
     * Eliminar un usuario (incluidos los clientes)
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