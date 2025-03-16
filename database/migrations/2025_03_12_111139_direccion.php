<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('direccion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_usuario')->constrained('usuario')->onDelete('cascade');
            $table->string('pais');
            $table->string('calle');
            $table->integer('portal');
            $table->integer('piso');
            $table->string('puerta');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('direccion');
    }
};
