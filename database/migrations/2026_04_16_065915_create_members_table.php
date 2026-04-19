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
        Schema::create('members', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->foreignId('application_id')->nullable()->constrained('member_applications')->nullOnDelete();
            $table->foreignId('axis_id')->nullable()->constrained('axes')->nullOnDelete();
            $table->foreignId('education_level_id')->nullable()->constrained('education_levels')->nullOnDelete();

            $table->enum('member_type', ['member', 'bureau'])->default('member');

            $table->string('member_number')->nullable()->unique();

            $table->string('first_name');
            $table->string('last_name');
            $table->string('gender', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('birth_place')->nullable();
            $table->string('cin', 12)->nullable();

            $table->string('photo')->nullable();

            $table->string('email')->nullable()->index();
            $table->string('phone', 30)->nullable()->index();
            $table->string('alternative_phone', 30)->nullable()->index();

            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('facebook')->nullable();

            $table->string('institution_name')->nullable();
            $table->string('field_of_study')->nullable();
            $table->boolean('is_student')->default(false);

            $table->boolean('is_sympathizer')->default(false);
            $table->boolean('is_from_antalaha')->default(true);

            $table->enum('status', [
                'pending',
                'active',
                'inactive',
                'suspended',
                'archived'
            ])->default('pending');

            $table->date('joined_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
