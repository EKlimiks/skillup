<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trade_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('device_model');
            $table->string('storage', 64)->nullable();
            $table->enum('device_condition', ['perfect', 'good', 'fair', 'broken']);
            $table->integer('battery_health')->nullable();
            $table->decimal('estimated_price', 10, 2);
            $table->decimal('final_price', 10, 2)->nullable();
            $table->enum('status', ['new', 'evaluated', 'accepted', 'rejected', 'completed'])->default('new');
            $table->string('customer_name');
            $table->string('customer_phone', 32);
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trade_ins');
    }
};
