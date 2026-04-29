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
        Schema::create('material_movements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->foreignId('material_loan_id')->nullable()->constrained('material_loans')->nullOnDelete();

            $table->enum('movement_type', ['entry', 'exit', 'loan', 'return', 'adjustment', 'loss', 'maintenance'])->default('entry');
            $table->integer('quantity')->default(1);
            $table->dateTime('movement_date');
            $table->string('source_location')->nullable();
            $table->string('destination_location')->nullable();
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
        Schema::dropIfExists('material_movements');
    }
};
