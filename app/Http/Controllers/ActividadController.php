<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ActividadController extends Controller
{
    public function actividadReciente()
    {
        $actividades = [];
        
        // Obtener últimas ventas desde tickets
        $tickets = Ticket::orderBy('created_at', 'desc')
                        ->take(10)
                        ->get();
        
        foreach ($tickets as $ticket) {
            $actividades[] = [
                'tipo' => 'venta',
                'descripcion' => "Nueva venta - €{$ticket->precio_total}",
                'tiempo' => $ticket->created_at,
                'timestamp' => $ticket->created_at->timestamp
            ];
        }
        
        // Para obtener actualizaciones como eventos individuales, necesitamos consultar
        // la tabla de productos directamente y obtener todas las actualizaciones
        $ultimasActualizaciones = DB::table('producto')
                                    ->select('id', 'nombre', 'updated_at')
                                    ->orderBy('updated_at', 'desc')
                                    ->take(20)
                                    ->get();
        
        foreach ($ultimasActualizaciones as $actualizacion) {
            $actividades[] = [
                'tipo' => 'producto',
                'descripcion' => "Producto actualizado - {$actualizacion->nombre}",
                'tiempo' => $actualizacion->updated_at,
                'timestamp' => strtotime($actualizacion->updated_at)
            ];
        }
        
        // Ordenar todas las actividades por tiempo más reciente
        usort($actividades, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });
        
        // Tomar solo las 10 más recientes para mostrar más variedad
        $actividades = array_slice($actividades, 0, 10);
        
        // Formatear la hora para la visualización
        foreach ($actividades as &$actividad) {
            $carbon = Carbon::parse($actividad['tiempo']);
            $carbon->addHour(); // Añadir una hora
            $actividad['tiempo_formateado'] = $carbon->format('H:i');
            unset($actividad['timestamp']);
            unset($actividad['tiempo']);
        }
        
        return response()->json($actividades);
    }
}