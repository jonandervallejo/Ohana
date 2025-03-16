<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    use HasFactory;

    protected $table = 'categoria';

    protected $fillable = [
        'nombre_cat',
        'descripcion',
    ];

    /**
     * Relación con el modelo Producto.
     * Una categoría puede tener muchos productos (1:N).
     * Un producto pertenece a una única categoría.
     */
    public function productos()
    {
        return $this->hasMany(Producto::class, 'id_categoria');
    }
}
