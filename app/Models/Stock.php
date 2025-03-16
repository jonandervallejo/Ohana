<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    use HasFactory;

    protected $table = 'stock';

    protected $fillable = [
        'id_producto',
        'talla',
        'color',
        'stock',
    ];

    /**
     * Relación con el modelo Producto.
     * Un stock pertenece a un producto (N:1).
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto');
    }
}
