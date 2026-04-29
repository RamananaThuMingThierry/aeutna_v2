<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('reference')->nullable()->unique();
            $table->string('category')->nullable()->index();
            $table->text('description')->nullable();

            $table->integer('quantity_total')->default(1);
            $table->integer('quantity_available')->default(1);
            $table->enum('condition_status', ['excellent', 'good', 'fair', 'damaged', 'out_of_service'])->default('good');
            $table->enum('status', ['available', 'in_use', 'maintenance', 'lost', 'archived'])->default('available');

            $table->string('storage_location')->nullable();
            $table->date('acquired_at')->nullable();
            $table->decimal('acquisition_cost', 12, 2)->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
