<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesDashboardController extends Controller
{
    /**
     * Read-only sales analytics. The domain defines no accounting/revenue
     * policy, so every figure is operational and derived from persisted data:
     *
     * - Status counts partition Order::STATUSES exactly (pending/confirmed/
     *   delivered/cancelled).
     * - "Delivered value" is the completed-sales figure: SUM(orders.total) for
     *   delivered orders only — the terminal, non-cancelled state. Pending and
     *   confirmed totals are shown per stage in the pipeline (operational
     *   value), and cancelled totals are never added to any sales figure
     *   (cancellation reverses the sale).
     * - Returns come from the authoritative SalesReturn.total and the persisted
     *   sales_return_items quantities — never recalculated. Returns never
     *   change order status; cancellation and returns stay distinct.
     * - Top products count committed sales only (confirmed + delivered — stock
     *   was deducted and not reversed) and subtract returned units.
     *
     * No COGS, profit, margin, tax or revenue-recognition figures are computed
     * — those are deferred until the project defines an accounting policy.
     * The dashboard never writes: 0 StockMovements, no status, quantity or
     * returned_quantity changes.
     */
    public function __invoke(Request $request)
    {
        $metrics = $this->metrics();

        return Inertia::render('Admin/SalesDashboard', [
            'sales' => [
                'metrics' => $metrics,
                'pipeline' => $this->pipeline($metrics),
                'returns' => $this->returns(),
                'recent_orders' => $this->recentOrders(),
                'top_customers' => $this->topCustomers(),
                'top_products' => $this->topProducts(),
                // quantity_before/after expose current stock levels, so sales
                // movements are gated by the same admin/manager rule as the
                // inventory routes — staff receive null (Phase 21 pattern).
                'movements' => $request->user()->isRole('admin', 'manager') ? $this->salesMovements() : null,
            ],
        ]);
    }

    private function metrics(): array
    {
        // One conditional aggregate over orders using the model's own status
        // constants: the counts partition every order, and each value is the
        // persisted authoritative order total for that status.
        $row = Order::selectRaw('
                count(*) as total_orders,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as pending_count,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as confirmed_count,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as delivered_count,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as cancelled_count,
                coalesce(sum(case when status = ? then total else 0 end), 0) as pending_value,
                coalesce(sum(case when status = ? then total else 0 end), 0) as confirmed_value,
                coalesce(sum(case when status = ? then total else 0 end), 0) as delivered_value,
                coalesce(sum(case when status = ? then total else 0 end), 0) as cancelled_value
            ', [
            Order::STATUS_PENDING,
            Order::STATUS_CONFIRMED,
            Order::STATUS_DELIVERED,
            Order::STATUS_CANCELLED,
            Order::STATUS_PENDING,
            Order::STATUS_CONFIRMED,
            Order::STATUS_DELIVERED,
            Order::STATUS_CANCELLED,
        ])->first();

        return [
            'total_orders' => (int) $row->total_orders,
            'pending' => (int) $row->pending_count,
            'confirmed' => (int) $row->confirmed_count,
            'delivered' => (int) $row->delivered_count,
            'cancelled' => (int) $row->cancelled_count,
            'pending_value' => number_format((float) $row->pending_value, 2, '.', ''),
            'confirmed_value' => number_format((float) $row->confirmed_value, 2, '.', ''),
            'delivered_value' => number_format((float) $row->delivered_value, 2, '.', ''),
            'cancelled_value' => number_format((float) $row->cancelled_value, 2, '.', ''),
        ];
    }

    private function pipeline(array $metrics): array
    {
        // Labels, ordering and values come from Order::STATUSES and the
        // already-computed metrics — no second query, and no duplicate status
        // constants in the frontend.
        return array_map(fn (string $status): array => [
            'status' => $status,
            'count' => $metrics[$status],
            'value' => $metrics[$status.'_value'],
        ], Order::STATUSES);
    }

    private function returns(): array
    {
        // Authoritative return aggregates: SalesReturn.total is persisted by
        // SalesReturnService and units come from the persisted return lines.
        $row = SalesReturn::selectRaw('count(*) as returns_count, coalesce(sum(total), 0) as returns_value')->first();

        return [
            'count' => (int) $row->returns_count,
            'quantity' => (int) SalesReturnItem::sum('quantity'),
            'value' => number_format((float) $row->returns_value, 2, '.', ''),
        ];
    }

    private function recentOrders()
    {
        // Newest first at the database (ordered_at, then id as tie-break),
        // bounded to eight rows; returned units per order arrive through a
        // withSum subquery, so no order triggers its own query.
        return Order::with('customer:id,company_name,contact_name')
            ->withSum('items as returned_quantity', 'returned_quantity')
            ->latest('ordered_at')
            ->latest('id')
            ->limit(8)
            ->get(['id', 'reference_number', 'customer_id', 'status', 'total', 'ordered_at']);
    }

    private function topCustomers()
    {
        // One row per customer: aggregates are subqueries (withCount/withSum),
        // never a join that would duplicate customer rows. order_value
        // deliberately excludes cancelled orders — their sale was reversed,
        // so including it would overstate customer value.
        return Customer::withCount(['orders', 'orders as delivered_orders_count' => function ($query): void {
            $query->where('status', Order::STATUS_DELIVERED);
        }])
            ->withSum(['orders as order_value' => function ($query): void {
                $query->where('status', '!=', Order::STATUS_CANCELLED);
            }], 'total')
            ->whereHas('orders')
            ->orderByDesc('orders_count')
            ->orderBy('id')
            ->limit(5)
            ->get(['id', 'company_name', 'contact_name'])
            ->map(function (Customer $customer): Customer {
                $customer->setAttribute('name', $customer->company_name ?: $customer->contact_name ?: '—');
                // Normalise the decimal sum to a 2dp string regardless of driver.
                $customer->setAttribute('order_value', number_format((float) ($customer->order_value ?? 0), 2, '.', ''));

                return $customer;
            });
    }

    private function topProducts(): array
    {
        // Committed sales only: order lines whose order reached confirmed or
        // delivered (stock deducted, never reversed) — pending and cancelled
        // lines are excluded in SQL. The join to orders is one-to-one per line
        // (every line belongs to exactly one order), so no row is duplicated.
        $sold = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', [Order::STATUS_CONFIRMED, Order::STATUS_DELIVERED])
            ->groupBy('order_items.product_variant_id')
            ->selectRaw('order_items.product_variant_id as product_variant_id, sum(order_items.quantity) as sold_quantity')
            ->orderByDesc('sold_quantity')
            ->orderBy('order_items.product_variant_id')
            ->limit(5)
            ->get();

        if ($sold->isEmpty()) {
            return [];
        }

        $variantIds = $sold->pluck('product_variant_id');
        $returned = SalesReturnItem::whereIn('product_variant_id', $variantIds)
            ->groupBy('product_variant_id')
            ->selectRaw('product_variant_id, sum(quantity) as returned_quantity')
            ->get()
            ->pluck('returned_quantity', 'product_variant_id');
        $variants = ProductVariant::with('product:id,name')
            ->whereIn('id', $variantIds)
            ->get()
            ->keyBy('id');

        $rows = [];

        foreach ($sold as $line) {
            $key = (int) $line->product_variant_id;
            $variant = $variants->get($key);

            if ($variant === null) {
                continue;
            }

            $soldQuantity = (int) $line->sold_quantity;
            $returnedQuantity = (int) $returned->get($key, 0);

            $rows[] = [
                'variant_id' => $variant->id,
                'product_name' => $variant->product->name,
                'variant_name' => $variant->name,
                'sold_quantity' => $soldQuantity,
                'returned_quantity' => $returnedQuantity,
                // Net is derived for display only (never persisted), clamped
                // at zero so bad historical data cannot render as negative.
                'net_quantity' => max(0, $soldQuantity - $returnedQuantity),
            ];
        }

        return $rows;
    }

    private function salesMovements()
    {
        // The existing sales-workflow ledger only: sale lines, cancellation
        // reversals and return restorations. No new movement type is invented
        // and historical rows are never rewritten.
        return StockMovement::with(['variant.product:id,name', 'user:id,name'])
            ->whereIn('movement_type', [
                StockMovement::TYPE_SALE,
                StockMovement::TYPE_CANCELLATION_IN,
                StockMovement::TYPE_RETURN_IN,
            ])
            ->latest('created_at')
            ->latest('id')
            ->limit(8)
            ->get();
    }
}
