<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $table = 'ticket';

    protected $fillable = [
        'id_compra',
        'id_stock',
        'cantidad',
        'precio_unitario',
        'precio_total',
        'estado',
    ];

    /**
     * Relación con el modelo Compra.
     * Un ticket pertenece a una compra (N:1).
     */
    public function compra()
    {
        return $this->belongsTo(Compra::class, 'id_compra');
    }

    /**
     * Relación con el modelo Stock.
     * Un ticket pertenece a un stock (N:1).
     */
    public function stock()
    {
        return $this->belongsTo(Stock::class, 'id_stock');
    }
}
