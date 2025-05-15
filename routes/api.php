<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminControllers\ProductoController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActividadController;
use App\Http\Controllers\EstadisticaController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\ProductosController;

// Rutas públicas de usuarios (acceso limitado)
Route::get('/usuarios/contar-clientes', [UsuarioController::class, 'contarClientes']);
Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
Route::get('/usuarios', [UsuarioController::class, 'index']);

Route::middleware('auth:sanctum')->group(function() {
    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::post('/usuarios', [UsuarioController::class, 'store']);
    Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
    Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);
});

// Rutas de productos - REORDENADAS para evitar conflictos
Route::get('/productos', [ProductoController::class, 'index']);
Route::get('/productos/buscar', [ProductoController::class, 'buscar']); // Movido arriba
Route::get('/productos/genero/{genero}', [ProductoController::class, 'getProductosPorGenero']); // Movido arriba
Route::get('/productos/imagenes', [ProductosController::class, 'obtenerImagenes']);
Route::get('/productos/categoria/{id_categoria}', [ProductoController::class, 'productosPorCategoria']);
// Ruta para obtener productos por IDs (favoritos)
Route::post('/productos/por-ids', [ProductoController::class, 'obtenerProductosPorIds']);
Route::get('/productos/{id}', [ProductoController::class, 'show']); // Movido abajo

// Rutas protegidas para productos (admin)
Route::middleware('auth:sanctum')->group(function() {
    Route::post('/productos', [ProductoController::class, 'store']);
    Route::put('/productos/{id}', [ProductoController::class, 'update']);
    Route::delete('/productos/{id}', [ProductoController::class, 'destroy']);
    //Route::get('/productos/{id}', [ProductoController::class, 'show']);
});

// Autenticación
Route::post('login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('user', [AuthController::class, 'user']);

// Restablecimiento de contraseña
Route::post('password/email', [PasswordResetController::class, 'sendResetLinkEmail'])->name('password.email');
Route::post('password/reset', [PasswordResetController::class, 'reset'])->name('password.update');
Route::get('password/reset/{token}', function($token) {
    $email = request('email', '');
    $source = request('from', ''); // Captura el parámetro 'from' (app o web)
    
    // Detectar automáticamente dispositivos móviles si no se especifica la fuente
    if (empty($source)) {
        $userAgent = request()->header('User-Agent');
        $isMobile = preg_match('/(android|iphone|ipad|mobile|okhttp|expo)/i', $userAgent);
        $source = $isMobile ? 'app' : 'web';
    }
    
    // Redirigir según el origen
    if ($source === 'app') {
        // URL profunda para la app móvil
        return redirect()->away("ohana://reset-password?token={$token}&email={$email}");
    } else {
        // URL para la web
        return redirect()->away("https://ohanatienda.ddns.net/:3000/new-password/{$token}?email={$email}");
    }
})->name('password.reset');

// Rutas del perfil y cierre de sesión
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [UserController::class, 'getProfile']);
    Route::post('/profile/update', [UserController::class, 'updateProfile']);
    Route::post('/profile/password', [UserController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Rutas para datos públicos
Route::get('/actividad-reciente', [ActividadController::class, 'actividadReciente']);
Route::get('/estadisticas/ventas-hoy', [EstadisticaController::class, 'ventasHoy']);
Route::get('/pedidos-pendientes', [CompraController::class, 'obtenerPedidosPendientes']);
Route::get('/categorias', [CategoriaController::class, 'index']);
Route::get('/productos-con-stock', [ProductoController::class, 'obtenerProductosConStock']);

Route::get('/stock', [StockController::class, 'obtenerStock']);
Route::post('/stock', [StockController::class, 'agregarStock']);
Route::get('/inventarios', [StockController::class, 'obtenerInventarios']);
Route::put('/inventarios/{id}', [StockController::class, 'actualizarInventario']);
Route::delete('/stock/{id}', [StockController::class, 'eliminarInventario']);

// Rutas de ventas
Route::get('/ventas', [VentaController::class, 'index']);
Route::post('/ventas', [VentaController::class, 'store']);
Route::get('/ventas/{id}', [VentaController::class, 'show']);
Route::put('/ventas/{id}/completar', [VentaController::class, 'completar']);
Route::put('/ventas/{id}/cancelar', [VentaController::class, 'cancelar']);
Route::get('/ventas-estadisticas', [VentaController::class, 'estadisticas']);
Route::delete('/ventas/{id}', [VentaController::class, 'destroy']);

// NUEVAS RUTAS PARA LA TIENDA
Route::prefix('tienda')->group(function() {
    // Rutas públicas para acceso a la tienda
    Route::post('/login', [UsuarioController::class, 'loginTienda']);
    Route::post('/registro', [UsuarioController::class, 'registroTienda']);
    
    // Rutas protegidas para la tienda (requieren autenticación)
    Route::middleware('auth:sanctum')->group(function() {
        // Obtener perfil del cliente
        Route::get('/perfil', function (Request $request) {
            $userId = $request->user()->id;
            return app()->make(UsuarioController::class)->show($request, $userId);
        });
        
        // Actualizar perfil del cliente (versión web)
        Route::put('/perfil', function (Request $request) {
            $userId = $request->user()->id;
            return app()->make(UsuarioController::class)->update($request, $userId);
        });
        
        // Actualizar perfil del cliente (versión app móvil)
        Route::post('/update-perfil', [UsuarioController::class, 'updatePerfilApp']);
        
        // Eliminar cuenta del cliente
        Route::delete('/cuenta', function (Request $request) {
            $cliente = $request->user();
            
            // Verificar que es un cliente
            if ($cliente->id_rol != UsuarioController::ROLE_CLIENTE) {
                return response()->json(['message' => 'Operación solo permitida para clientes'], 403);
            }
            
            // Revocar tokens antes de eliminar
            $cliente->tokens()->delete();
            
            // Eliminar usuario
            $cliente->delete();
            
            Log::info('Cliente eliminó su cuenta en tienda', [
                'client_id' => $cliente->id,
                'email' => $cliente->email,
                'ip' => $request->ip()
            ]);
            
            return response()->json(['message' => 'Cuenta eliminada correctamente']);
        });
        
        // Cerrar sesión (logout) para clientes
        Route::post('/logout', function (Request $request) {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Sesión cerrada correctamente']);
        });
    });
});

Route::get('/test-proxy', function () {
    return [
        'is_secure' => request()->isSecure(),
        'scheme' => request()->getScheme(),
        'url' => url('/test-proxy'),
    ];
});