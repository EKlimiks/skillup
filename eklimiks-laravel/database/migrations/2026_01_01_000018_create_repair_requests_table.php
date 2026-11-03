<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('repair_service_id')->constrained('repair_services')->cascadeOnDelete();
            $table->foreignId('master_id')->nullable()->constrained('masters')->nullOnDelete();
            $table->foreignId('master_slot_id')->nullable()->constrained('master_slots')->nullOnDelete();
            $table->string('device_model');
            $table->text('issue');
            $table->string('customer_name');
            $table->string('customer_phone', 32);
            $table->enum('status', ['new', 'diagnostics', 'approved', 'in_progress', 'ready', 'done', 'cancelled'])->default('new');
            $table->decimal('price', 10, 2)->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_requests');
    }
};
