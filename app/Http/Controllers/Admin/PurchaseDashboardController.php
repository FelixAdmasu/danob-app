<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReceipt;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Collection;
use Inertia\Inertia;

class PurchaseDashboardController extends Controller
{
    public function __invoke()
    {
        return Inertia::render('Admin/PurchaseDashboard', [
            'purchases' => [
                'metrics' => $this->metrics(),
                'outstanding' => $this->outstanding(),
                'partial' => $this->partiallyReceived(),
                'recent_receipts' => $this->recentReceipts(),
                'supplier_activity' => $this->supplierActivity(),
                'recent_purchase_orders' => $this->recentPurchaseOrders(),
            ],
        ]);
    }

    private function metrics(): array
    {
        // One conditional aggregate over purchase_orders using the model's own
        // status constants: open = anything still awaiting approval or
        // receiving (received and cancelled are finished, so excluded), and
        // purchase value sums the authoritative PO total for every order
        // except cancelled ones — cancelled orders are dead pipeline (they can
        // no longer be edited, approved or received per canBeEdited()/
        // canBeReceived()).
        $row = PurchaseOrder::selectRaw('
                count(*) as total_pos,
                coalesce(sum(case when status not in (?, ?) then 1 else 0 end), 0) as open_count,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as partial_count,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as received_count,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as cancelled_count,
                coalesce(sum(case when status <> ? then total else 0 end), 0) as purchase_value
            ', [
            PurchaseOrder::STATUS_RECEIVED,
            PurchaseOrder::STATUS_CANCELLED,
            PurchaseOrder::STATUS_PARTIALLY_RECEIVED,
            PurchaseOrder::STATUS_RECEIVED,
            PurchaseOrder::STATUS_CANCELLED,
            PurchaseOrder::STATUS_CANCELLED,
        ])->first();

        return [
            'total_pos' => (int) $row->total_pos,
            'open' => (int) $row->open_count,
            'partially_received' => (int) $row->partial_count,
            'received' => (int) $row->received_count,
            'cancelled' => (int) $row->cancelled_count,
            'purchase_value' => number_format((float) $row->purchase_value, 2, '.', ''),
            // Supplier.is_active is the model's own notion of an active
            // supplier; whereHas keeps this a single existence subquery.
            'suppliers_with_purchases' => Supplier::where('is_active', true)
                ->whereHas('purchaseOrders')
                ->count(),
        ];
    }

    private function outstanding(): Collection
    {
        // Everything not yet finished still requires action (draft/submitted
        // need approval, approved/partial need receiving); received and
        // cancelled orders are excluded in SQL. Quantity totals come from
        // withSum subqueries, so rows stay constant-count (no N+1), and the
        // oldest orders surface first because they have waited longest.
        $orders = PurchaseOrder::with('supplier:id,name')
            ->withSum('items as ordered_quantity', 'quantity')
            ->withSum('items as received_quantity', 'received_quantity')
            ->whereNotIn('status', [
                PurchaseOrder::STATUS_RECEIVED,
                PurchaseOrder::STATUS_CANCELLED,
            ])
            ->orderBy('ordered_at')
            ->orderBy('id')
            ->limit(10)
            ->get(['id', 'po_number', 'supplier_id', 'status', 'ordered_at', 'expected_at', 'total']);

        return $this->withRemaining($orders);
    }

    private function partiallyReceived(): Collection
    {
        // Line-level partial visibility: at least one line has received some
        // but not all of its quantity. Cancelled orders are excluded because
        // they require no further receiving action; received orders cannot
        // match this predicate once receiving completes them.
        $orders = PurchaseOrder::with('supplier:id,name')
            ->withSum('items as ordered_quantity', 'quantity')
            ->withSum('items as received_quantity', 'received_quantity')
            ->whereHas('items', function ($query): void {
                $query->where('received_quantity', '>', 0)
                    ->whereColumn('received_quantity', '<', 'quantity');
            })
            ->where('status', '!=', PurchaseOrder::STATUS_CANCELLED)
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'po_number', 'supplier_id', 'status', 'ordered_at', 'total']);

        return $this->withRemaining($orders);
    }

    /**
     * Remaining quantity is derived for display only (never persisted):
     * ordered - received, clamped at zero so bad historical data cannot
     * render as a negative remaining value.
     */
    private function withRemaining(Collection $orders): Collection
    {
        return $orders->map(function (PurchaseOrder $po): PurchaseOrder {
            $ordered = (int) ($po->ordered_quantity ?? 0);
            $received = (int) ($po->received_quantity ?? 0);
            $po->setAttribute('ordered_quantity', $ordered);
            $po->setAttribute('received_quantity', $received);

            return $po->setAttribute('remaining_quantity', max(0, $ordered - $received));
        });
    }

    private function recentReceipts(): Collection
    {
        // purchase_receipts has no persisted amount/status column, so only
        // persisted quantities and relationships are shown. Relations are
        // eager-loaded (order, supplier, receiver) and units arrive through a
        // withSum subquery, so no receipt row triggers its own query.
        return PurchaseReceipt::with([
            'purchaseOrder:id,po_number,supplier_id',
            'purchaseOrder.supplier:id,name',
            'receiver:id,name',
        ])
            ->withSum('items as units_received', 'quantity')
            ->latest('received_at')
            ->latest('id')
            ->limit(5)
            ->get(['id', 'receipt_number', 'purchase_order_id', 'received_by', 'received_at']);
    }

    private function supplierActivity(): Collection
    {
        // One row per supplier: aggregates are subqueries (withCount/withSum),
        // never a join that would duplicate supplier rows, and only suppliers
        // that actually have purchase orders are represented.
        return Supplier::withCount('purchaseOrders')
            ->withCount(['purchaseOrders as open_purchase_orders_count' => function ($query): void {
                $query->whereNotIn('status', [
                    PurchaseOrder::STATUS_RECEIVED,
                    PurchaseOrder::STATUS_CANCELLED,
                ]);
            }])
            ->withSum(['purchaseOrders as purchase_value' => function ($query): void {
                $query->where('status', '!=', PurchaseOrder::STATUS_CANCELLED);
            }], 'total')
            ->whereHas('purchaseOrders')
            ->orderByDesc('purchase_orders_count')
            ->orderBy('name')
            ->limit(5)
            ->get(['id', 'name'])
            ->map(function (Supplier $supplier): Supplier {
                // Normalise the decimal sum to a 2dp string regardless of driver.
                $supplier->setAttribute('purchase_value', number_format((float) ($supplier->purchase_value ?? 0), 2, '.', ''));

                return $supplier;
            });
    }

    private function recentPurchaseOrders(): Collection
    {
        return PurchaseOrder::with('supplier:id,name')
            ->latest('created_at')
            ->latest('id')
            ->limit(8)
            ->get(['id', 'po_number', 'supplier_id', 'status', 'ordered_at', 'total', 'created_at']);
    }
}
