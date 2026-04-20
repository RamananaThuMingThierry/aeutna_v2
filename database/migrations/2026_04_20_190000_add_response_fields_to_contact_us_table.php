<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_us', function (Blueprint $table) {
            $table->string('response_subject')->nullable()->after('message');
            $table->text('response_message')->nullable()->after('response_subject');
            $table->timestamp('responded_at')->nullable()->after('response_message');
            $table->foreignId('responded_by')->nullable()->after('responded_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contact_us', function (Blueprint $table) {
            $table->dropConstrainedForeignId('responded_by');
            $table->dropColumn(['response_subject', 'response_message', 'responded_at']);
        });
    }
};
