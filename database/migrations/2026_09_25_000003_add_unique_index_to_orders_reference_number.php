<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reference numbers are derived from the rows that already exist, so when
     * there is no row to lock — the first order of a calendar year, and the
     * first order of a fresh database — only this index can turn a concurrent
     * duplicate into a detectable, retryable error instead of a second row
     * with the same label. purchase_orders.po_number already carries the
     * equivalent constraint; orders.reference_number had none.
     *
     * Safe to add: orders was verified to hold no duplicate
     * reference_number values on the Danob local database first.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->unique('reference_number');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique(['reference_number']);
        });
    }
};
