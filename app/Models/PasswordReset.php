<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordReset extends Model
{
    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'password_resets';

    /**
     * Desactivar timestamps automáticos porque la tabla solo tiene created_at
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array
     */
    protected $fillable = [
        'email',
        'token',
        'created_at'
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     *
     * @var array
     */
    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Verificar si un token ha expirado
     *
     * @return bool
     */
    public function isExpired()
    {
        // Token expira después de 24 horas
        return $this->created_at->diffInHours(now()) > 24;
    }
}