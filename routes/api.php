<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminControllers\ProductoController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\Auth\PasswordResetController;

Route::get('/usuarios', [UsuarioController::class, 'index']);
Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);

Route::get('/productos', [ProductoController::class, 'index']);
Route::get('/productos/{id}', [ProductoController::class, 'show']);
Route::get('/productos/categoria/{id_categoria}', [ProductoController::class, 'productosPorCategoria']);
Route::post('/productos', [ProductoController::class, 'store']);
Route::put('/productos/{id}', [ProductoController::class, 'update']);
Route::delete('/productos/{id}', [ProductoController::class, 'destroy']);

Route::post('login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('user', [AuthController::class, 'user']);

Route::post('/password/reset', [PasswordResetController::class, 'reset']);