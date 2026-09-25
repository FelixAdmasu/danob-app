<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->boolean('is_featured')->default(false)->after('status');
            $table->unsignedInteger('featured_sort_order')->default(0)->after('is_featured');
            $table->index(['is_featured', 'featured_sort_order']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropIndex(['is_featured', 'featured_sort_order']);
            $table->dropColumn(['is_featured', 'featured_sort_order']);
        });
    }
};
