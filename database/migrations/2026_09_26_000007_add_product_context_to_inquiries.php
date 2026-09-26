<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiries', function (Blueprint $table): void {
            $table->foreignId('product_id')->nullable()->after('interest')->constrained()->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->after('product_id')->constrained('product_variants')->nullOnDelete();
            $table->unsignedInteger('requested_quantity')->nullable()->after('variant_id');
            $table->index(['product_id', 'variant_id']);
        });
    }

    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table): void {
            $table->dropIndex(['product_id', 'variant_id']);
            $table->dropConstrainedForeignId('variant_id');
            $table->dropConstrainedForeignId('product_id');
            $table->dropColumn('requested_quantity');
        });
    }
};
