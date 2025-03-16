<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('ticket', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_compra')->constrained('compra')->onDelete('cascade'); // Cambiado de id_usuario a id_compra
            $table->foreignId('id_stock')->constrained('stock')->onDelete('cascade'); // Relacionado con stock
            $table->integer('cantidad')->default(1);
            $table->decimal('precio_unitario', 10, 2);
            $table->decimal('precio_total', 10, 2);
            $table->string('estado')->default('pendiente'); // pendiente, pagado, cancelado
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('ticket');
    }
};
