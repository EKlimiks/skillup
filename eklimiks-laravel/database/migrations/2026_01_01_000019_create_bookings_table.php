<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->date('slot_date');
            $table->time('slot_time');
            $table->enum('status', ['new', 'confirmed', 'completed', 'cancelled'])->default('new');
            $table->string('customer_name');
            $table->string('customer_phone', 32);
            $table->timestamps();

            $table->unique(['store_id', 'slot_date', 'slot_time'], 'bookings_store_slot_unique');
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
