<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Direccion extends Model
{
    use HasFactory;

    protected $table = 'direccion';

    protected $fillable = [
        'id_usuario',
        'pais',
        'calle',
        'portal',
        'piso',
        'puerta'
    ];

    /**
     * Relación con el modelo Usuario.
     * Una dirección pertenece a un usuario específico (N:1).
     * Un usuario puede tener muchas direcciones asociadas.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }
}
