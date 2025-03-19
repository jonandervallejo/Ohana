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

// Rutas públicas
Route::get('/usuarios', [UsuarioController::class, 'index']);
Route::get('/usuarios/contar-clientes', [UsuarioController::class, 'contarClientes']);
Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);

// Rutas de productos
Route::get('/productos', [ProductoController::class, 'index']);
Route::get('/productos/{id}', [ProductoController::class, 'show']);
Route::get('/productos/categoria/{id_categoria}', [ProductoController::class, 'productosPorCategoria']);

// Rutas protegidas para productos (admin)
Route::middleware('auth:sanctum')->group(function() {
    Route::post('/productos', [ProductoController::class, 'store']);
    Route::put('/productos/{id}', [ProductoController::class, 'update']);
    Route::delete('/productos/{id}', [ProductoController::class, 'destroy']);
});

// Autenticación
Route::post('login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('user', [AuthController::class, 'user']);

// Restablecimiento de contraseña
Route::post('password/email', [PasswordResetController::class, 'sendResetLinkEmail'])->name('password.email');
Route::post('password/reset', [PasswordResetController::class, 'reset'])->name('password.update');
Route::get('password/reset/{token}', function($token) {
    $email = request('email', '');
    return redirect()->away("http://88.15.26.49:3000/new-password/{$token}?email={$email}");
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