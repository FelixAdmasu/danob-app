<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table): void {
            // Nullable: null means low-stock monitoring is disabled for this
            // variant, so existing rows are never flagged as low stock.
            $table->integer('low_stock_threshold')->nullable()->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table): void {
            $table->dropColumn('low_stock_threshold');
        });
    }
};
