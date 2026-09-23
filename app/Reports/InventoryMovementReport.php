<?php

declare(strict_types=1);

namespace App\Reports;

use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Report A — Inventory Movements (page AND CSV export).
 *
 * The stock ledger itself (StockMovement): rows expose the persisted
 * before/after quantities, and Units In/Out are derived from those same
 * persisted ledger columns (quantity_after > quantity_before is an IN
 * movement) so no movement-type direction mapping is duplicated here.
 * The summary reflects the active filters, mirroring the visible rows.
 *
 * Date field: created_at.
 */
final class InventoryMovementReport extends Report
{
    public function rules(): array
    {
        return [
            'product_id' => 'nullable|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'movement_type' => 'nullable|in:'.implode(',', StockMovement::TYPES),
            'user_id' => 'nullable|exists:users,id',
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ];
    }

    public function query(array $validated): Builder
    {
        $query = StockMovement::query();

        if (! empty($validated['product_id'])) {
            $productId = $validated['product_id'];
            $query->whereHas('variant', fn ($q) => $q->where('product_id', $productId));
        }

        if (! empty($validated['variant_id'])) {
            $query->where('product_variant_id', $validated['variant_id']);
        }

        if (! empty($validated['movement_type'])) {
            $query->where('movement_type', $validated['movement_type']);
        }

        if (! empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search): void {
                // Search the reason text plus the variant (name/SKU) and its
                // product name — all database-side, parameter-bound LIKEs.
                $q->where('reason', 'like', "%{$search}%")
                    ->orWhereHas('variant', function ($v) use ($search): void {
                        $v->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$search}%"));
                    });
            });
        }

        $this->applyDateRange($query, 'created_at', $validated['date_from'] ?? null, $validated['date_to'] ?? null);

        return $query;
    }

    public function summary(Builder $query): array
    {
        $summary = $query->clone()->toBase()->selectRaw('
                count(*) as movement_count,
                coalesce(sum(case when quantity_after > quantity_before then quantity else 0 end), 0) as units_in,
                coalesce(sum(case when quantity_after < quantity_before then quantity else 0 end), 0) as units_out
            ')->first();

        return [
            'movement_count' => (int) $summary->movement_count,
            'units_in' => (int) $summary->units_in,
            'units_out' => (int) $summary->units_out,
        ];
    }

    public function rows(Builder $query): Builder
    {
        // The morph reference is eager-loaded per distinct type (bounded by
        // the movement types present, never one query per row).
        return $query->with(['variant.product:id,name', 'user:id,name', 'reference'])
            ->latest('created_at')
            ->latest('id');
    }

    public function filters(array $validated): array
    {
        return [
            'product_id' => $validated['product_id'] ?? null,
            'variant_id' => $validated['variant_id'] ?? null,
            'movement_type' => $validated['movement_type'] ?? null,
            'user_id' => $validated['user_id'] ?? null,
            'search' => $validated['search'] ?? null,
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
        ];
    }

    public function columns(): array
    {
        return [
            'Date',
            'Movement Type',
            'Product',
            'Variant',
            'Quantity',
            'Before Quantity',
            'After Quantity',
            'User',
            'Reference',
            'Reason',
            'Notes',
        ];
    }

    public function mapRows(Model $model): array
    {
        /** @var StockMovement $movement */
        $movement = $model;

        return [[
            $movement->created_at?->format('Y-m-d H:i:s'),
            $movement->movement_type,
            $movement->variant?->product?->name,
            $movement->variant?->name,
            $movement->quantity,
            $movement->quantity_before,
            $movement->quantity_after,
            $movement->user?->name,
            $this->referenceLabel($movement),
            $movement->reason,
            $movement->notes,
        ]];
    }

    /**
     * Same derivation as the page's referenceLabel(): last segment of the
     * morph type plus the id (e.g. "SalesReturn #3"), never a new lookup.
     */
    private function referenceLabel(StockMovement $movement): ?string
    {
        if ($movement->reference_type === null || $movement->reference_id === null) {
            return null;
        }

        $segments = explode('\\', $movement->reference_type);

        return end($segments).' #'.$movement->reference_id;
    }
}
