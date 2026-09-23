<?php

declare(strict_types=1);

namespace App\Reports;

use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Report E — Low Stock (page AND CSV export).
 *
 * The Phase 20 semantics are reused verbatim (same validation vocabulary,
 * same SQL mirror of ProductVariant::stockStatus(), same active-only base,
 * same summary counts) so this report cannot drift from the Low Stock
 * page. The PHP stockStatus() method stays the single authoritative rule;
 * tests pin both views to it. Read-only: derived status only, never
 * mutates stock. The export ships the backend status code (in_stock /
 * low_stock / out_of_stock) — the vocabulary tests already pin — never a
 * re-mapped copy of it.
 */
final class LowStockReport extends Report
{
    public function rules(): array
    {
        return [
            'status' => 'nullable|in:attention,low,out,monitored',
            'search' => 'nullable|string|max:255',
        ];
    }

    public function query(array $validated): Builder
    {
        $status = $this->status($validated);
        $search = $this->search($validated);

        // SQL mirror of ProductVariant::stockStatus() — backend stays
        // authoritative and the page only reads the derived status.
        $query = ProductVariant::query()->where('is_active', true);

        if ($status === 'low') {
            $query->whereNotNull('low_stock_threshold')
                ->where('quantity', '>', 0)
                ->whereColumn('quantity', '<=', 'low_stock_threshold');
        } elseif ($status === 'out') {
            $query->where('quantity', '<=', 0);
        } elseif ($status === 'monitored') {
            $query->whereNotNull('low_stock_threshold');
        } else {
            $query->where(fn ($q) => $q
                ->where('quantity', '<=', 0)
                ->orWhere(fn ($q2) => $q2->whereNotNull('low_stock_threshold')
                    ->whereColumn('quantity', '<=', 'low_stock_threshold')));
        }

        if ($search !== null && $search !== '') {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$search}%")));
        }

        return $query;
    }

    public function summary(Builder $query): array
    {
        // Global active-variant cards, exactly as Phase 24 rendered them:
        // the three counts deliberately ignore the row filters ($query), so
        // they stay inventory-wide context above the filtered rows.
        $activeVariants = fn () => ProductVariant::where('is_active', true);

        return [
            'low' => $activeVariants()->whereNotNull('low_stock_threshold')
                ->where('quantity', '>', 0)
                ->whereColumn('quantity', '<=', 'low_stock_threshold')->count(),
            'out' => $activeVariants()->where('quantity', '<=', 0)->count(),
            'monitored' => $activeVariants()->whereNotNull('low_stock_threshold')->count(),
        ];
    }

    public function rows(Builder $query): Builder
    {
        return $query->with(['product:id,name'])
            ->orderBy('quantity')
            ->orderBy('name');
    }

    public function filters(array $validated): array
    {
        return [
            'status' => $this->status($validated),
            'search' => $this->search($validated),
        ];
    }

    public function columns(): array
    {
        return [
            'Product',
            'Variant',
            'SKU',
            'Quantity',
            'Threshold',
            'Stock Status',
        ];
    }

    public function mapRows(Model $model): array
    {
        /** @var ProductVariant $variant */
        $variant = $model;

        return [[
            $variant->product?->name,
            $variant->name,
            $variant->sku,
            $variant->quantity,
            $variant->low_stock_threshold,
            $variant->stock_status,
        ]];
    }

    /** Default must stay in ONE place so query and filters can never drift. */
    private function status(array $validated): string
    {
        return $validated['status'] ?? 'attention';
    }

    private function search(array $validated): ?string
    {
        return $validated['search'] ?? null;
    }
}
