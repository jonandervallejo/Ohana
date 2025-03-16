<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CarritoStock extends Model
{
    use HasFactory;

    protected $table = 'carrito_stock';

    protected $fillable = [
        'carrito_id',
        'stock_id',
    ];

    /**
     * Relación con el modelo Carrito.
     * Un carrito_stock pertenece a un carrito específico. (1:N)
     */
    public function carrito()
    {
        return $this->belongsTo(Carrito::class);
    }

    /**
     * Relación con el modelo Stock.
     * Un carrito_stock pertenece a un stock específico. (1:N)
     */
    public function stock()
    {
        return $this->belongsTo(Stock::class);
    }
}
