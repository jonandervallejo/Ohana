<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('categoria', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_cat', 100);
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('categoria');
    }
};
