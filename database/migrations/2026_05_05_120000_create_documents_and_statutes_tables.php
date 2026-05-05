<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('document_type', 50)->index();
            $table->string('file_name')->nullable();
            $table->string('file_path')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->enum('visibility', ['public', 'admin', 'private'])->default('private');
            $table->enum('publication_status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['document_type', 'visibility']);
            $table->index(['publication_status', 'published_at']);
        });

        Schema::create('statutes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('version', 30)->default('1.0');
            $table->enum('publication_status', ['draft', 'validated', 'published', 'archived'])->default('draft');
            $table->enum('visibility', ['public', 'admin', 'private'])->default('admin');
            $table->date('validated_at')->nullable();
            $table->date('effective_at')->nullable();
            $table->boolean('is_current')->default(false);
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->timestamps();

            $table->index(['publication_status', 'visibility']);
            $table->index('is_current');
        });

        Schema::create('statute_titles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('statute_id')->constrained('statutes')->cascadeOnDelete();
            $table->string('number', 20);
            $table->string('heading');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['statute_id', 'number']);
            $table->index(['statute_id', 'sort_order']);
        });

        Schema::create('statute_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('statute_title_id')->constrained('statute_titles')->cascadeOnDelete();
            $table->string('article_number', 20);
            $table->string('title')->nullable();
            $table->longText('content');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['statute_title_id', 'article_number']);
            $table->index(['statute_title_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('statute_articles');
        Schema::dropIfExists('statute_titles');
        Schema::dropIfExists('statutes');
        Schema::dropIfExists('documents');
    }
};
