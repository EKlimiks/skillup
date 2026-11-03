<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_id')->constrained('masters')->cascadeOnDelete();
            $table->date('date');
            $table->time('time');
            $table->boolean('is_booked')->default(false);
            $table->timestamps();

            // Один мастер не может иметь два одинаковых слота на одну дату и время
            $table->unique(['master_id', 'date', 'time'], 'master_slots_unique');
            $table->index(['master_id', 'date', 'is_booked']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_slots');
    }
};
