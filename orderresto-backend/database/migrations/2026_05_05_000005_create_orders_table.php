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
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignId('table_id')->nullable()->constrained('restaurant_tables')->nullOnDelete();
            $table->string('status')->default('nouvelle');
            $table->string('order_type')->default('sur_place');
            $table->text('special_instructions')->nullable();
            $table->string('customer_phone')->nullable();
            $table->decimal('total', 10, 2)->default(0);
            $table->unsignedInteger('estimated_prep_minutes')->default(15);
            $table->timestamp('served_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'status']);
            $table->index(['restaurant_id', 'order_type']);
            $table->index('table_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};