<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;

    protected $table = 'usuario';

    protected $fillable = [
        'nombre',
        'apellido1',
        'apellido2',
        'email',
        'password',
        'telefono',
        'id_rol',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password' => 'hashed',
    ];

    /**
     * Relación con el modelo Rol.
     * Un usuario pertenece a un rol específico (1:N).
     */
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'id_rol');
    }

    /**
     * Relación con el modelo Notificacion.
     * Un usuario tiene muchas notificaciones (1:N).
     */
    public function notificaciones()
    {
        return $this->hasMany(Notificacion::class, 'id_usuario', 'id');
    }

    /**
     * Relación con el modelo Direccion.
     * Un usuario puede tener muchas direcciones de envío (1:N).
     */
    public function direccion()
    {
        return $this->hasMany(Direccion::class, 'id_usuario', 'id');
    }

    /**
     * Relación con el modelo Compra.
     * Un usuario puede tener muchas compras (1:N).
     */
    public function compra()
    {
        return $this->hasMany(Compra::class, 'id_usuario', 'id');
    }

    /**
     * Relación con el modelo Carrito.
     * Un usuario puede tener muchos carritos (1:N).
     */
    public function carrito()
    {
        return $this->hasMany(Carrito::class, 'id_usuario', 'id');
    }

}