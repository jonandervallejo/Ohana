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
    return redirect()->away("http://ohanatienda.ddns.net:3000/new-password/{$token}?email={$email}");
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