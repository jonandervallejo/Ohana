<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    use HasFactory;

    protected $table = 'rol';

    protected $fillable = [
        'nombre_rol'
    ];

    /**
     * Relación con el modelo Usuario.
     * Un rol puede tener muchos usuarios asociados (1:N).
     */
    public function usuario()
    {
        return $this->hasMany(Usuario::class, 'id_rol', 'id');
    }
}
