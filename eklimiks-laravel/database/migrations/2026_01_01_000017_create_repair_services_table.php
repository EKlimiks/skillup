<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_services', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description');
            $table->decimal('price_from', 10, 2);
            $table->integer('duration_minutes')->default(60);
            $table->timestamps();

            $table->index('price_from');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_services');
    }
};
