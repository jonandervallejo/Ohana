<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;

    protected $table = 'producto';

    protected $fillable = [
        'nombre',
        'descripcion',
        'precio',
        'imagen',
        'imagenes',
        'talla',
        'tipo',
        'id_categoria',
    ];

    /**
     * Relación con el modelo Categoria.
     * Un producto pertenece a una categoría (N:1).
     */
    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'id_categoria');
    }

    /**
     * Relación con el modelo Stock.
     * Un producto puede tener muchos stocks asociados (1:N).
     */
    public function stocks()
    {
        return $this->hasMany(Stock::class, 'id_producto');
    }
}
