<?php

declare(strict_types=1);

namespace App\Reports;

use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Report F — Suppliers (page AND CSV export).
 *
 * Aggregates are withCount/withSum subqueries (one row per supplier, no
 * join duplication): purchase order count, open purchase orders (Phase 22
 * open semantics — not received, not cancelled), total purchase value
 * (Phase 22 semantics — cancelled excluded) and the most recent order
 * date. No supplier financial/accounting metrics are invented.
 *
 * No date filter: the aggregates are lifetime figures, so a supplier date
 * range would filter rows without meaningfully scoping them.
 */
final class SupplierReport extends Report
{
    public function rules(): array
    {
        return [
            'status' => 'nullable|in:active,inactive',
            'search' => 'nullable|string|max:255',
        ];
    }

    public function query(array $validated): Builder
    {
        $search = $validated['search'] ?? null;
        $status = $validated['status'] ?? null;

        $query = Supplier::query();

        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        return $query;
    }

    public function summary(Builder $query): array
    {
        // Summary over the filtered set; purchase_orders reuses the same
        // filtered builder as a subquery so the filters are defined once.
        return [
            'suppliers' => $query->clone()->count(),
            'active_suppliers' => $query->clone()->where('is_active', true)->count(),
            'suppliers_with_purchases' => $query->clone()->whereHas('purchaseOrders')->count(),
            'purchase_orders' => PurchaseOrder::whereIn(
                'supplier_id',
                $query->clone()->select('id'),
            )->count(),
        ];
    }

    public function rows(Builder $query): Builder
    {
        return $query->withCount('purchaseOrders')
            ->withCount(['purchaseOrders as open_purchase_orders_count' => function ($q): void {
                $q->whereNotIn('status', [
                    PurchaseOrder::STATUS_RECEIVED,
                    PurchaseOrder::STATUS_CANCELLED,
                ]);
            }])
            ->withSum(['purchaseOrders as purchase_value' => function ($q): void {
                $q->where('status', '!=', PurchaseOrder::STATUS_CANCELLED);
            }], 'total')
            ->withMax('purchaseOrders as last_ordered_at', 'ordered_at')
            ->latest()
            ->latest('id');
    }

    public function transformRow(Model $model): Model
    {
        /** @var Supplier $supplier */
        $supplier = $model;

        $supplier->setAttribute('purchase_orders_count', (int) ($supplier->purchase_orders_count ?? 0));
        $supplier->setAttribute('open_purchase_orders_count', (int) ($supplier->open_purchase_orders_count ?? 0));
        // Normalise the decimal sum to a 2dp string regardless of driver.
        $supplier->setAttribute('purchase_value', number_format((float) ($supplier->purchase_value ?? 0), 2, '.', ''));

        return $supplier;
    }

    public function filters(array $validated): array
    {
        return [
            'status' => $validated['status'] ?? null,
            'search' => $validated['search'] ?? null,
        ];
    }

    public function columns(): array
    {
        return [
            'Supplier',
            'Status',
            'Purchase Orders',
            'Open Purchase Orders',
            'Purchase Value',
            'Last Order',
        ];
    }

    public function mapRows(Model $model): array
    {
        /** @var Supplier $supplier */
        $supplier = $model;

        return [[
            $supplier->name,
            $supplier->is_active ? 'Active' : 'Inactive',
            $supplier->purchase_orders_count,
            $supplier->open_purchase_orders_count,
            $supplier->purchase_value,
            $supplier->last_ordered_at,
        ]];
    }
}
