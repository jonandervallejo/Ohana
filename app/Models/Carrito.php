<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carrito extends Model
{
    use HasFactory;

    protected $table = 'carrito';

    protected $fillable = [
        'id_usuario',
        'cantidad'
    ];

    /**
     * Relación con el modelo Usuario.
     * Un carrito pertenece a un usuario específico (1:N).
     * Un usuario puede tener muchos carritos.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }

    /**
     * Relación con el modelo CarritoStock.
     * Un carrito puede tener múltiples productos en el carrito (1:N).
     * Un carrito puede tener muchos productos a través de CarritoStock.
     */
    public function carritoStock()
    {
        return $this->hasMany(CarritoStock::class, 'carrito_id');
    }
}
