<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use Carbon\Carbon;

class EstadisticaController extends Controller
{
    public function ventasHoy()
    {
        // Obtener la fecha de hoy (inicio y fin)
        $hoy_inicio = Carbon::today();
        $hoy_fin = Carbon::today()->endOfDay();
        
        // Sumar el precio_total de todos los tickets creados hoy
        $ventasHoy = Ticket::whereBetween('created_at', [$hoy_inicio, $hoy_fin])
            ->sum('precio_total');
        
        return response()->json([
            'fecha' => Carbon::today()->toDateString(),
            'total_ventas' => $ventasHoy
        ]);
    }
}