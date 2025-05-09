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

     /**
     * Login para la tienda (solo clientes)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function loginTienda(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Datos de inicio de sesión incorrectos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Buscar usuario por email
            $usuario = Usuario::where('email', $request->email)->first();
            
            // Verificar que el usuario existe y es cliente
            if (!$usuario || $usuario->id_rol !== self::ROLE_CLIENTE) {
                Log::info('Intento de acceso a tienda rechazado: usuario no es cliente o no existe', [
                    'email' => $request->email,
                    'ip' => $request->ip()
                ]);
                
                return response()->json([
                    'message' => 'Acceso denegado. Solo clientes pueden acceder a la tienda.'
                ], 403);
            }
            
            // Verificar contraseña
            if (!Hash::check($request->password, $usuario->password)) {
                Log::info('Intento de acceso a tienda rechazado: contraseña incorrecta', [
                    'email' => $request->email,
                    'ip' => $request->ip()
                ]);
                
                return response()->json([
                    'message' => 'Credenciales incorrectas'
                ], 401);
            }
            
            // Crear token para el cliente
            $token = $usuario->createToken('tienda-client-token')->plainTextToken;
            
            Log::info('Login exitoso a tienda', [
                'user_id' => $usuario->id,
                'email' => $usuario->email,
                'ip' => $request->ip()
            ]);
            
            return response()->json([
                'message' => 'Login exitoso',
                'user' => [
                    'id' => $usuario->id,
                    'nombre' => $usuario->nombre,
                    'apellido1' => $usuario->apellido1,
                    'apellido2' => $usuario->apellido2,
                    'email' => $usuario->email,
                    'telefono' => $usuario->telefono,
                ],
                'token' => $token
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error en login de tienda', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'email' => $request->email ?? 'no proporcionado'
            ]);
            
            return response()->json([
                'message' => 'Error al procesar el inicio de sesión',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registro de nuevo cliente en la tienda (función pública)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function registroTienda(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:255',
                'apellido1' => 'required|string|max:255',
                'apellido2' => 'nullable|string|max:255',
                'email' => 'required|string|email|max:255|unique:usuario',
                'password' => 'required|string|min:6|confirmed',
                'telefono' => 'nullable|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Crear nuevo cliente (siempre con rol de cliente)
            $cliente = new Usuario([
                'nombre' => $request->nombre,
                'apellido1' => !empty($request->apellido1) ? $request->apellido1 : '-',
                'apellido2' => $request->apellido2 ?? '',
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'id_rol' => self::ROLE_CLIENTE, // Aseguramos que siempre sea cliente
                'telefono' => $request->telefono ?? null,
            ]);

            $cliente->save();
            
            // Crear token para el nuevo cliente
            $token = $cliente->createToken('tienda-client-token')->plainTextToken;
            
            Log::info('Nuevo cliente registrado en tienda', [
                'client_id' => $cliente->id,
                'email' => $cliente->email,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'message' => 'Registro completado con éxito',
                'user' => [
                    'id' => $cliente->id,
                    'nombre' => $cliente->nombre,
                    'apellido1' => $cliente->apellido1,
                    'apellido2' => $cliente->apellido2,
                    'email' => $cliente->email,
                    'telefono' => $cliente->telefono,
                ],
                'token' => $token
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error en registro de tienda', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'datos' => $request->except('password', 'password_confirmation')
            ]);
            
            return response()->json([
                'message' => 'Error al procesar el registro',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updatePerfilApp(Request $request)
{
    try {
        // Obtener el usuario autenticado
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'Usuario no autenticado'
            ], 401);
        }
        
        // Validar datos
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'apellido1' => 'sometimes|required|string|max:255',
            'apellido2' => 'nullable|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('usuario')->ignore($user->id)
            ],
            'telefono' => 'nullable|string|max:20',
            'current_password' => 'required_with:password|string',
            'password' => 'nullable|string|min:6|confirmed',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Verificar la contraseña actual si se quiere cambiar la contraseña
        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta',
                    'errors' => [
                        'current_password' => ['La contraseña actual no coincide con nuestros registros']
                    ]
                ], 422);
            }
        }
        
        // Actualizar campos
        if ($request->filled('nombre')) {
            $user->nombre = $request->nombre;
        }
        
        if ($request->has('apellido1')) {
            $user->apellido1 = !empty($request->apellido1) ? $request->apellido1 : '-';
        }
        
        if ($request->has('apellido2')) {
            $user->apellido2 = $request->apellido2 ?? '';
        }
        
        if ($request->filled('email')) {
            $user->email = strtolower($request->email);
        }
        
        if ($request->filled('telefono')) {
            $user->telefono = $request->telefono;
        }
        
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        
        // Guardar cambios
        $user->save();
        
        Log::info('Usuario actualizó su perfil desde la app', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado correctamente',
            'user' => [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'apellido1' => $user->apellido1,
                'apellido2' => $user->apellido2,
                'email' => $user->email,
                'telefono' => $user->telefono
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error al actualizar perfil de usuario desde app', [
            'user_id' => $request->user()->id ?? 'unknown',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'success' => false,
            'message' => 'Error al actualizar el perfil',
            'error' => $e->getMessage()
        ], 500);
    }
}
}