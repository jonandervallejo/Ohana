<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * El nombre de la tabla asociada con el modelo.
     * Especificado explícitamente porque está en singular.
     */
    protected $table = 'usuario';

    /**
     * Los atributos que son asignables masivamente.
     */
    protected $fillable = [
        'nombre',
        'apellidos',
        'email',
        'password',
        'id_rol',
        'telefono',
    ];

    /**
     * Los atributos que deben ocultarse para las matrices.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Los atributos que deben convertirse.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
    
    /**
     * Definición de roles
     */
    const ROLE_ADMIN = 1;
    const ROLE_TECNICO = 2;
    const ROLE_CLIENTE = 3;

    /**
     * Verifica si el usuario es administrador
     */
    public function isAdmin()
    {
        return $this->id_rol === self::ROLE_ADMIN;
    }

    /**
     * Verifica si el usuario es técnico
     */
    public function isTecnico()
    {
        return $this->id_rol === self::ROLE_TECNICO;
    }

    /**
     * Verifica si el usuario es cliente
     */
    public function isCliente()
    {
        return $this->id_rol === self::ROLE_CLIENTE;
    }
}