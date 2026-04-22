<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('report_type', 50);
            $table->date('report_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->string('subject')->nullable();
            $table->text('agenda')->nullable();
            $table->longText('content');
            $table->text('decisions_summary')->nullable();
            $table->boolean('is_confidential')->default(true);
            $table->string('status', 30)->default('draft');
            $table->foreignId('written_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['report_type', 'report_date']);
            $table->index(['status', 'report_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
