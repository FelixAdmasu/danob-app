<?php

declare(strict_types=1);

namespace App\Reports;

use App\Models\SalesReturn;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Report D — Sales Returns (page AND CSV export).
 *
 * Return Value is the authoritative persisted SalesReturn.total — never a
 * recalculated value — and returned quantity comes from the persisted
 * return lines. Returns do not change order status: the original order
 * stays Delivered (cancellation and returns remain distinct).
 *
 * The page shows one row per return (Units = Σ line quantities, Return
 * Value = SalesReturn.total). The export additionally exposes the return's
 * product/variant lines, so it writes ONE ROW PER RETURN LINE with the
 * return-level fields repeated — the only faithful way to give Product,
 * Variant, Quantity and Value real values. Because SalesReturnService
 * builds total as the exact sum of the persisted line subtotals, summing
 * an export's Quantity/Value cells per return reproduces the page's Units
 * and Return Value figures exactly (cross-consistency tests pin this).
 *
 * Date field: returned_at.
 */
final class ReturnReport extends Report
{
    public function rules(): array
    {
        return [
            'customer_id' => 'nullable|exists:customers,id',
            'product_id' => 'nullable|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ];
    }

    public function query(array $validated): Builder
    {
        $query = SalesReturn::query();

        if (! empty($validated['customer_id'])) {
            $customerId = $validated['customer_id'];
            $query->whereHas('order', fn ($q) => $q->where('customer_id', $customerId));
        }

        if (! empty($validated['product_id'])) {
            $productId = $validated['product_id'];
            $query->whereHas('items', fn ($q) => $q->whereHas(
                'productVariant',
                fn ($v) => $v->where('product_id', $productId),
            ));
        }

        if (! empty($validated['variant_id'])) {
            $variantId = $validated['variant_id'];
            $query->whereHas('items', fn ($q) => $q->where('product_variant_id', $variantId));
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('return_number', 'like', "%{$search}%")
                    ->orWhereHas('order', function ($o) use ($search): void {
                        $o->where('reference_number', 'like', "%{$search}%")
                            ->orWhereHas('customer', fn ($c) => $c->where('company_name', 'like', "%{$search}%")
                                ->orWhere('contact_name', 'like', "%{$search}%"));
                    });
            });
        }

        $this->applyDateRange($query, 'returned_at', $validated['date_from'] ?? null, $validated['date_to'] ?? null);

        return $query;
    }

    public function summary(Builder $query): array
    {
        // Returned units use the same outer-sum-wrapped correlated subquery
        // as reports B and C so the figure aggregates every matching return.
        $summary = $query->clone()->toBase()->selectRaw('
                count(*) as return_count,
                coalesce(sum(total), 0) as return_value,
                coalesce(sum((
                    select coalesce(sum(sales_return_items.quantity), 0)
                    from sales_return_items
                    where sales_return_items.sales_return_id = sales_returns.id
                )), 0) as returned_units
            ')->first();

        return [
            'return_count' => (int) $summary->return_count,
            'returned_units' => (int) $summary->returned_units,
            'return_value' => number_format((float) $summary->return_value, 2, '.', ''),
        ];
    }

    public function rows(Builder $query): Builder
    {
        return $query->with([
            'order:id,reference_number,customer_id',
            'order.customer:id,company_name,contact_name',
            'returnedBy:id,name',
        ])
            ->withSum('items as returned_quantity', 'quantity')
            ->latest('returned_at')
            ->latest('id');
    }

    public function transformRow(Model $model): Model
    {
        /** @var SalesReturn $return */
        $return = $model;

        $return->setAttribute('returned_quantity', (int) ($return->returned_quantity ?? 0));

        return $return;
    }

    public function exportEagerLoads(): array
    {
        // The page never serialises return lines, so the export loads them
        // separately (deterministic line order, variant product for the
        // Product column) without touching the Phase 24 page payload.
        return [
            'items' => fn ($q) => $q->orderBy('id'),
            'items.productVariant.product',
        ];
    }

    public function filters(array $validated): array
    {
        return [
            'customer_id' => $validated['customer_id'] ?? null,
            'product_id' => $validated['product_id'] ?? null,
            'variant_id' => $validated['variant_id'] ?? null,
            'search' => $validated['search'] ?? null,
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
        ];
    }

    public function columns(): array
    {
        return [
            'Return',
            'Order',
            'Customer',
            'Product',
            'Variant',
            'Quantity',
            'Value',
            'Returned By',
            'Returned At',
        ];
    }

    public function mapRows(Model $model): array
    {
        /** @var SalesReturn $return */
        $return = $model;

        $customer = $return->order?->customer;
        $customerName = $customer ? ($customer->company_name ?: $customer->contact_name ?: null) : null;

        $rows = [];
        foreach ($return->items as $item) {
            $rows[] = [
                $return->return_number,
                $return->order?->reference_number,
                $customerName,
                $item->productVariant?->product?->name,
                $item->productVariant?->name,
                $item->quantity,
                $item->subtotal,
                $return->returnedBy?->name,
                $return->returned_at?->format('Y-m-d'),
            ];
        }

        return $rows;
    }
}
