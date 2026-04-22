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
        Schema::create('member_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('axis_id')->nullable()->constrained('axes')->nullOnDelete();
            $table->foreignId('education_level_id')->nullable()->constrained('education_levels')->nullOnDelete();

            $table->enum('member_type', ['member', 'bureau'])->default('member');

            $table->string('first_name');
            $table->string('last_name');
            $table->string('gender', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('birth_place')->nullable();
            $table->string('cin', 12)->nullable();

            $table->string('photo')->nullable();

            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('alternative_phone', 30)->nullable();
            $table->string('facebook')->nullable();

            $table->string('address')->nullable();

            $table->string('institution_name')->nullable();
            $table->string('field_of_study')->nullable();
            $table->boolean('is_student')->default(false);

            $table->boolean('is_sympathizer')->default(false);

            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->decimal('payment_amount', 12, 2)->nullable();
            $table->string('payment_proof_path')->nullable();
            $table->date('payment_date')->nullable();

            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'approved',
                'rejected',
                'needs_correction'
            ])->default('draft');

            $table->text('admin_comment')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_applications');
    }
};
