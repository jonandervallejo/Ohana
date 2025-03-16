<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_producto')->constrained('producto')->onDelete('cascade');
            $table->string('talla', 50)->nullable();
            $table->string('color', 50)->nullable();
            $table->integer('stock')->default(0);
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('stock');
    }
};

