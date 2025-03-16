<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notificacion extends Model
{
    use HasFactory;

    protected $table = 'notificacion';

    protected $fillable = [
        'id_usuario',
        'titulo',
        'mensaje',
    ];

    /**
     * Relación con el modelo Usuario.
     * Una notificación pertenece a un usuario específico (N:1).
     * Un usuario puede tener muchas notificaciones.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }
}
