<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    use HasFactory;

    protected $table = 'compra';

    protected $fillable = [
        'id_usuario',
        'estado'
    ];

    /**
     * Relación con el modelo Usuario.
     * Una compra pertenece a un usuario específico (N:1).
     * Un usuario puede tener muchas compras asociadas.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }

    /**
     * Relación con el modelo Ticket.
     * Una compra tiene un solo ticket asociado que contiene todos los productos (1:1).
     * Un ticket está asociado solo a una compra.
     */
    public function ticket()
    {
        return $this->hasOne(Ticket::class, 'id_compra');
    }
}
