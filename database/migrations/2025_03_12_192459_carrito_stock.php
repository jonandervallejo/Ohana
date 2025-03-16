<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carrito_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('carrito_id')->constrained('carrito')->onDelete('cascade'); // FK de carrito
            $table->foreignId('stock_id')->constrained('stock')->onDelete('cascade'); // FK de stock
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carrito_stock');
    }
};
