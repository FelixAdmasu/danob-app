<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table): void {
            // Mirrors purchase_order_items.received_quantity: tracks how much
            // of an ordered line has already been returned so the remaining
            // returnable quantity can be enforced per line.
            $table->integer('returned_quantity')->default(0)->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropColumn('returned_quantity');
        });
    }
};
