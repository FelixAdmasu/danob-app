<?php

declare(strict_types=1);

namespace App\Reports;

use App\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Report B — Purchases (page AND CSV export).
 *
 * Ordered/received quantities arrive through withSum subqueries and the
 * outstanding quantity is the same display-only, zero-clamped derivation
 * as PurchaseDashboard::withRemaining() (ordered − received), with
 * cancelled orders shown as 0 because cancelled POs are dead pipeline and
 * never outstanding. Purchase Value keeps the Phase 22 semantics: the
 * authoritative PO total, excluding cancelled orders (row cells always
 * show the PO's own total, exactly like the page's Total column).
 *
 * Date field: ordered_at (the purchase order's own order date).
 */
final class PurchaseReport extends Report
{
    public function rules(): array
    {
        return [
            'supplier_id' => 'nullable|exists:suppliers,id',
            'status' => 'nullable|in:'.implode(',', PurchaseOrder::STATUSES),
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ];
    }

    public function query(array $validated): Builder
    {
        $query = PurchaseOrder::query();

        if (! empty($validated['supplier_id'])) {
            $query->where('supplier_id', $validated['supplier_id']);
        }

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('po_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }

        $this->applyDateRange($query, 'ordered_at', $validated['date_from'] ?? null, $validated['date_to'] ?? null);

        return $query;
    }

    public function summary(Builder $query): array
    {
        // PO-level summary: counts and purchase value (Phase 22 scope).
        $summary = $query->clone()->toBase()->selectRaw('
                count(*) as purchase_orders,
                coalesce(sum(case when status not in (?, ?) then 1 else 0 end), 0) as open_orders,
                coalesce(sum(case when status <> ? then total else 0 end), 0) as purchase_value
            ', [
            PurchaseOrder::STATUS_RECEIVED,
            PurchaseOrder::STATUS_CANCELLED,
            PurchaseOrder::STATUS_CANCELLED,
        ])->first();

        // Unit totals via correlated subqueries: one scalar per order, so no
        // join can multiply rows. Outstanding is clamped per order (never per
        // aggregate) and cancelled orders contribute 0, matching the rows.
        $units = $query->clone()->toBase()->selectRaw('
                coalesce(sum((
                    select coalesce(sum(poi.quantity), 0)
                    from purchase_order_items poi
                    where poi.purchase_order_id = purchase_orders.id
                )), 0) as ordered_units,
                coalesce(sum((
                    select coalesce(sum(poi.received_quantity), 0)
                    from purchase_order_items poi
                    where poi.purchase_order_id = purchase_orders.id
                )), 0) as received_units,
                coalesce(sum(case when purchase_orders.status = ? then 0 else (
                    select case
                        when coalesce(sum(poi.quantity), 0) >= coalesce(sum(poi.received_quantity), 0)
                            then coalesce(sum(poi.quantity), 0) - coalesce(sum(poi.received_quantity), 0)
                        else 0
                    end
                    from purchase_order_items poi
                    where poi.purchase_order_id = purchase_orders.id
                ) end), 0) as outstanding_units
            ', [PurchaseOrder::STATUS_CANCELLED])->first();

        return [
            'purchase_orders' => (int) $summary->purchase_orders,
            'open_orders' => (int) $summary->open_orders,
            'ordered_units' => (int) $units->ordered_units,
            'received_units' => (int) $units->received_units,
            'outstanding_units' => (int) $units->outstanding_units,
            'purchase_value' => number_format((float) $summary->purchase_value, 2, '.', ''),
        ];
    }

    public function rows(Builder $query): Builder
    {
        return $query->with('supplier:id,name')
            ->withSum('items as ordered_quantity', 'quantity')
            ->withSum('items as received_quantity', 'received_quantity')
            ->latest('ordered_at')
            ->latest('id');
    }

    public function transformRow(Model $model): Model
    {
        /** @var PurchaseOrder $purchaseOrder */
        $purchaseOrder = $model;

        $ordered = (int) ($purchaseOrder->ordered_quantity ?? 0);
        $received = (int) ($purchaseOrder->received_quantity ?? 0);
        $purchaseOrder->setAttribute('ordered_quantity', $ordered);
        $purchaseOrder->setAttribute('received_quantity', $received);
        $purchaseOrder->setAttribute(
            'remaining_quantity',
            $purchaseOrder->status === PurchaseOrder::STATUS_CANCELLED ? 0 : max(0, $ordered - $received),
        );

        return $purchaseOrder;
    }

    public function filters(array $validated): array
    {
        return [
            'supplier_id' => $validated['supplier_id'] ?? null,
            'status' => $validated['status'] ?? null,
            'search' => $validated['search'] ?? null,
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
        ];
    }

    public function columns(): array
    {
        return [
            'Purchase Order',
            'Supplier',
            'Status',
            'Ordered Date',
            'Ordered Units',
            'Received Units',
            'Outstanding Units',
            'Purchase Value',
        ];
    }

    public function mapRows(Model $model): array
    {
        /** @var PurchaseOrder $purchaseOrder */
        $purchaseOrder = $model;

        return [[
            $purchaseOrder->po_number,
            $purchaseOrder->supplier?->name,
            $purchaseOrder->status,
            $purchaseOrder->ordered_at?->format('Y-m-d'),
            $purchaseOrder->ordered_quantity,
            $purchaseOrder->received_quantity,
            $purchaseOrder->remaining_quantity,
            $purchaseOrder->total,
        ]];
    }
}
