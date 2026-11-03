<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('number')->unique();
            $table->enum('status', ['new', 'confirmed', 'assembled', 'delivered', 'cancelled'])->default('new');
            $table->decimal('total', 10, 2);
            $table->enum('delivery_type', ['pickup', 'courier'])->default('pickup');
            $table->string('address')->nullable();
            $table->string('customer_name');
            $table->string('customer_phone', 32);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
