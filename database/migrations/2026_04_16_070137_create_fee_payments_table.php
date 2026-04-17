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
        Schema::create('fee_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->foreignId('annual_fee_id')->constrained('annual_fees')->cascadeOnDelete();

            $table->decimal('amount_due', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0);

            $table->enum('payment_status', [
                'unpaid',
                'partial',
                'paid',
                'cancelled',
            ])->default('unpaid');

            $table->enum('validation_status', [
                'pending',
                'validated',
                'cancelled',
            ])->default('pending');

            $table->string('payment_method')->nullable();
            $table->string('reference')->nullable();
            $table->date('paid_at')->nullable();
            $table->string('proof_path')->nullable();

            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreignId('cancelled_by')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancel_reason')->nullable();

            $table->unique(['member_id', 'annual_fee_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_payments');
    }
};
