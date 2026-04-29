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
        Schema::create('donations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();

            $table->string('donor_name');
            $table->string('donor_email')->nullable();
            $table->string('donor_phone', 30)->nullable();

            $table->enum('donation_type', ['money', 'material', 'service', 'other'])->default('money');
            $table->decimal('amount', 12, 2)->nullable();
            $table->date('donation_date')->nullable();
            $table->string('reference')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_anonymous')->default(false);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
