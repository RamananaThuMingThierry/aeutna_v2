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
        Schema::create('membership_cards', function (Blueprint $table) {
            $table->id();

            $table->foreignId('member_id')->constrained()->cascadeOnDelete();

            $table->string('card_number')->unique();
            $table->string('qr_code')->nullable();
            $table->year('issue_year');
            $table->date('issued_at')->nullable();
            $table->date('expires_at')->nullable();

            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');

            $table->string('pdf_path')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_cards');
    }
};
