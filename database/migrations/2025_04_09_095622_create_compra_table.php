<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCompraTable extends Migration
{
    public function up()
    {
        Schema::create('compra', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_usuario')->constrained('usuario')->onDelete('cascade');
            $table->enum('estado', ['pendiente', 'completada', 'cancelada'])->default('pendiente');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('compra');
    }
}
