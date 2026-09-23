<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\SalesReturn;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Operational reporting — a read-only window over existing domain data.
 *
 * Boundaries honoured here:
 * - Every method only reads. Reports create 0 StockMovements and never touch
 *   quantities, order statuses, returned_quantity, SalesReturns, purchase
 *   orders, suppliers, customers or thresholds.
 * - No accounting policy is invented: no revenue, COGS, profit, margin, tax,
 *   FIFO/WAC or inventory valuation. Figures keep their operational labels
 *   (Delivered Sales Value, Return Value, Purchase Value) exactly as the
 *   dashboards established them.
 * - Status vocabularies always come from the model constants (never
 *   duplicated in React), detailed reports paginate (20 rows, the app's
 *   standard) with withQueryString() so filters survive pagination, and
 *   ordering is fixed and deterministic (business timestamp DESC, id DESC).
 *   There is no request-driven sorting, so no column whitelist is needed.
 * - Date filters are inclusive calendar-day ranges (whereDate) on each
 *   report's own timestamp: movements -> created_at, purchases -> ordered_at,
 *   sales -> ordered_at, returns -> returned_at.
 * - Queries stay database-side (filters, aggregates, subqueries): no N+1, no
 *   PHP-side filtering of full tables, no caching.
 *
 * Phase 25 exports should reuse these query methods rather than re-deriving
 * any of this logic.
 */
class ReportController extends Controller
{
    /**
     * Reports directory. Cards are filtered server-side with the same
     * isRole() rule as the report routes, so a role only ever sees links it
     * is allowed to open (staff get the sales-facing group only).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $definitions = [
            ['name' => 'Inventory', 'reports' => [
                ['title' => 'Inventory Movements', 'description' => 'Review stock changes across products, variants, users and movement types.', 'href' => route('admin.reports.inventory-movements'), 'roles' => ['admin', 'manager']],
                ['title' => 'Low Stock', 'description' => 'Variants that are out of stock or at/below their low-stock threshold.', 'href' => route('admin.reports.low-stock'), 'roles' => ['admin', 'manager']],
            ]],
            ['name' => 'Purchasing', 'reports' => [
                ['title' => 'Purchases', 'description' => 'Purchase orders with ordered, received and outstanding quantities.', 'href' => route('admin.reports.purchases'), 'roles' => ['admin', 'manager']],
                ['title' => 'Suppliers', 'description' => 'Supplier activity: purchase counts, open orders and purchase value.', 'href' => route('admin.reports.suppliers'), 'roles' => ['admin', 'manager']],
            ]],
            ['name' => 'Sales', 'reports' => [
                ['title' => 'Sales', 'description' => 'Orders by status, date and customer with delivered sales value.', 'href' => route('admin.reports.sales'), 'roles' => []],
                ['title' => 'Returns', 'description' => 'Processed sales returns with quantities and return value.', 'href' => route('admin.reports.returns'), 'roles' => []],
                ['title' => 'Customers', 'description' => 'Customer order counts, delivered orders and delivered sales value.', 'href' => route('admin.reports.customers'), 'roles' => []],
            ]],
        ];

        $groups = [];
        foreach ($definitions as $group) {
            $reports = array_values(array_filter($group['reports'], function (array $report) use ($user): bool {
                return $report['roles'] === [] || $user->isRole(...$report['roles']);
            }));

            if ($reports !== []) {
                $groups[] = ['name' => $group['name'], 'reports' => $reports];
            }
        }

        return Inertia::render('Admin/Reports/Index', [
            'groups' => $groups,
        ]);
    }

    /**
     * Report A — Inventory Movement Report.
     *
     * The stock ledger itself (StockMovement): rows expose the persisted
     * before/after quantities, and Units In/Out are derived from those same
     * persisted ledger columns (quantity_after > quantity_before is an IN
     * movement) so no movement-type direction mapping is duplicated here.
     * The summary reflects the active filters, mirroring the visible rows.
     */
    public function inventoryMovements(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'movement_type' => 'nullable|in:'.implode(',', StockMovement::TYPES),
            'user_id' => 'nullable|exists:users,id',
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

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

        $summary = $query->clone()->toBase()->selectRaw('
                count(*) as movement_count,
                coalesce(sum(case when quantity_after > quantity_before then quantity else 0 end), 0) as units_in,
                coalesce(sum(case when quantity_after < quantity_before then quantity else 0 end), 0) as units_out
            ')->first();

        // The morph reference is eager-loaded per distinct type (bounded by
        // the movement types present, never one query per row).
        $movements = $query->with(['variant.product:id,name', 'user:id,name', 'reference'])
            ->latest('created_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Reports/InventoryMovements', [
            'movements' => $movements,
            'summary' => [
                'movement_count' => (int) $summary->movement_count,
                'units_in' => (int) $summary->units_in,
                'units_out' => (int) $summary->units_out,
            ],
            'filters' => [
                'product_id' => $validated['product_id'] ?? null,
                'variant_id' => $validated['variant_id'] ?? null,
                'movement_type' => $validated['movement_type'] ?? null,
                'user_id' => $validated['user_id'] ?? null,
                'search' => $validated['search'] ?? null,
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
            ],
            'products' => Product::orderBy('name')->get(['id', 'name']),
            'variants' => ProductVariant::with('product:id,name')->orderBy('name')->get(['id', 'name', 'product_id']),
            'users' => User::orderBy('name')->get(['id', 'name']),
            'movement_types' => StockMovement::TYPES,
        ]);
    }

    /**
     * Report B — Purchase Report.
     *
     * Ordered/received quantities arrive through withSum subqueries and the
     * outstanding quantity is the same display-only, zero-clamped
     * derivation as PurchaseDashboard::withRemaining() (ordered − received),
     * with cancelled orders shown as 0 because cancelled POs are dead
     * pipeline and never outstanding. Purchase Value keeps the Phase 22
     * semantics: the authoritative PO total, excluding cancelled orders.
     *
     * Date field: ordered_at (the purchase order's own order date).
     */
    public function purchases(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'status' => 'nullable|in:'.implode(',', PurchaseOrder::STATUSES),
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

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

        $orders = $query->with('supplier:id,name')
            ->withSum('items as ordered_quantity', 'quantity')
            ->withSum('items as received_quantity', 'received_quantity')
            ->latest('ordered_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $orders->getCollection()->transform(function (PurchaseOrder $po): PurchaseOrder {
            $ordered = (int) ($po->ordered_quantity ?? 0);
            $received = (int) ($po->received_quantity ?? 0);
            $po->setAttribute('ordered_quantity', $ordered);
            $po->setAttribute('received_quantity', $received);
            $po->setAttribute(
                'remaining_quantity',
                $po->status === PurchaseOrder::STATUS_CANCELLED ? 0 : max(0, $ordered - $received),
            );

            return $po;
        });

        return Inertia::render('Admin/Reports/Purchases', [
            'purchase_orders' => $orders,
            'summary' => [
                'purchase_orders' => (int) $summary->purchase_orders,
                'open_orders' => (int) $summary->open_orders,
                'ordered_units' => (int) $units->ordered_units,
                'received_units' => (int) $units->received_units,
                'outstanding_units' => (int) $units->outstanding_units,
                'purchase_value' => number_format((float) $summary->purchase_value, 2, '.', ''),
            ],
            'filters' => [
                'supplier_id' => $validated['supplier_id'] ?? null,
                'status' => $validated['status'] ?? null,
                'search' => $validated['search'] ?? null,
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
            ],
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            'purchase_statuses' => PurchaseOrder::STATUSES,
        ]);
    }

    /**
     * Report C — Sales Report.
     *
     * Every order status is shown as-is (pending/confirmed/delivered/
     * cancelled stay obvious). Delivered Sales Value is Phase 23's
     * operational figure: SUM(orders.total) for delivered orders only —
     * cancelled totals never count as sales. Returned quantity and return
     * value are derived per order (persisted counters and SalesReturn.total,
     * never recalculated); a returned order keeps its Delivered status and
     * the return information is shown in separate columns.
     *
     * Date field: ordered_at.
     */
    public function sales(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:'.implode(',', Order::STATUSES),
            'customer_id' => 'nullable|exists:customers,id',
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = Order::query();

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['customer_id'])) {
            $query->where('customer_id', $validated['customer_id']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('company_name', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%"));
            });
        }

        $this->applyDateRange($query, 'ordered_at', $validated['date_from'] ?? null, $validated['date_to'] ?? null);

        // One filtered aggregate. Each return total is a correlated scalar
        // subquery wrapped in the outer sum (report B's pattern): a bare
        // scalar column alongside count/sum is evaluated against a single
        // arbitrary row instead of being aggregated across every order.
        $summary = $query->clone()->toBase()->selectRaw('
                count(*) as orders,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as delivered_orders,
                coalesce(sum(case when status = ? then total else 0 end), 0) as delivered_sales_value,
                coalesce(sum((
                    select coalesce(sum(order_items.returned_quantity), 0)
                    from order_items
                    where order_items.order_id = orders.id
                )), 0) as returned_units,
                coalesce(sum((
                    select coalesce(sum(sales_returns.total), 0)
                    from sales_returns
                    where sales_returns.order_id = orders.id
                )), 0) as return_value
            ', [
            Order::STATUS_DELIVERED,
            Order::STATUS_DELIVERED,
        ])->first();

        $orders = $query->with('customer:id,company_name,contact_name')
            ->withSum('items as returned_quantity', 'returned_quantity')
            ->withSum('returns as return_value', 'total')
            ->latest('ordered_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $orders->getCollection()->transform(function (Order $order): Order {
            $order->setAttribute('returned_quantity', (int) ($order->returned_quantity ?? 0));
            $order->setAttribute('return_value', number_format((float) ($order->return_value ?? 0), 2, '.', ''));

            return $order;
        });

        return Inertia::render('Admin/Reports/Sales', [
            'orders' => $orders,
            'summary' => [
                'orders' => (int) $summary->orders,
                'delivered_orders' => (int) $summary->delivered_orders,
                'delivered_sales_value' => number_format((float) $summary->delivered_sales_value, 2, '.', ''),
                'returned_units' => (int) $summary->returned_units,
                'return_value' => number_format((float) $summary->return_value, 2, '.', ''),
            ],
            'filters' => [
                'status' => $validated['status'] ?? null,
                'customer_id' => $validated['customer_id'] ?? null,
                'search' => $validated['search'] ?? null,
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
            ],
            'customers' => Customer::orderBy('company_name')->orderBy('contact_name')->get(['id', 'company_name', 'contact_name']),
            'order_statuses' => Order::STATUSES,
        ]);
    }

    /**
     * Report D — Sales Returns Report.
     *
     * Return Value is the authoritative persisted SalesReturn.total — never
     * a recalculated value — and returned quantity comes from the persisted
     * return lines. Returns do not change order status: the original order
     * stays Delivered (cancellation and returns remain distinct).
     *
     * Date field: returned_at.
     */
    public function returns(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'product_id' => 'nullable|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

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

        $returns = $query->with([
            'order:id,reference_number,customer_id',
            'order.customer:id,company_name,contact_name',
            'returnedBy:id,name',
        ])
            ->withSum('items as returned_quantity', 'quantity')
            ->latest('returned_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $returns->getCollection()->transform(function (SalesReturn $return): SalesReturn {
            $return->setAttribute('returned_quantity', (int) ($return->returned_quantity ?? 0));

            return $return;
        });

        return Inertia::render('Admin/Reports/Returns', [
            'returns' => $returns,
            'summary' => [
                'return_count' => (int) $summary->return_count,
                'returned_units' => (int) $summary->returned_units,
                'return_value' => number_format((float) $summary->return_value, 2, '.', ''),
            ],
            'filters' => [
                'customer_id' => $validated['customer_id'] ?? null,
                'product_id' => $validated['product_id'] ?? null,
                'variant_id' => $validated['variant_id'] ?? null,
                'search' => $validated['search'] ?? null,
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
            ],
            'customers' => Customer::orderBy('company_name')->orderBy('contact_name')->get(['id', 'company_name', 'contact_name']),
            'products' => Product::orderBy('name')->get(['id', 'name']),
            'variants' => ProductVariant::with('product:id,name')->orderBy('name')->get(['id', 'name', 'product_id']),
        ]);
    }

    /**
     * Report E — Low Stock Report.
     *
     * The Phase 20 semantics are reused verbatim (same validation
     * vocabulary, same SQL mirror of ProductVariant::stockStatus(), same
     * active-only base, same summary counts) so this report cannot drift
     * from the Low Stock page. The PHP stockStatus() method stays the
     * single authoritative rule; tests pin both views to it. Read-only:
     * derived status only, never mutates stock.
     */
    public function lowStock(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:attention,low,out,monitored',
            'search' => 'nullable|string|max:255',
        ]);

        $status = $validated['status'] ?? 'attention';
        $search = $validated['search'] ?? null;

        // SQL mirror of ProductVariant::stockStatus() — backend stays
        // authoritative and the page only reads the derived status.
        $query = ProductVariant::with(['product:id,name'])
            ->where('is_active', true);

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

        $variants = $query->orderBy('quantity')->orderBy('name')->paginate(20)->withQueryString();

        $activeVariants = fn () => ProductVariant::where('is_active', true);

        return Inertia::render('Admin/Reports/LowStock', [
            'variants' => $variants,
            'counts' => [
                'low' => $activeVariants()->whereNotNull('low_stock_threshold')
                    ->where('quantity', '>', 0)
                    ->whereColumn('quantity', '<=', 'low_stock_threshold')->count(),
                'out' => $activeVariants()->where('quantity', '<=', 0)->count(),
                'monitored' => $activeVariants()->whereNotNull('low_stock_threshold')->count(),
            ],
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Report F — Supplier Report.
     *
     * Aggregates are withCount/withSum subqueries (one row per supplier, no
     * join duplication): purchase order count, open purchase orders (Phase
     * 22 open semantics — not received, not cancelled), total purchase value
     * (Phase 22 semantics — cancelled excluded) and the most recent order
     * date. No supplier financial/accounting metrics are invented.
     *
     * No date filter: the aggregates are lifetime figures, so a supplier
     * date range would filter rows without meaningfully scoping them.
     */
    public function suppliers(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:active,inactive',
            'search' => 'nullable|string|max:255',
        ]);

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

        // Summary over the filtered set; purchase_orders reuses the same
        // filtered builder as a subquery so the filters are defined once.
        $summary = [
            'suppliers' => $query->clone()->count(),
            'active_suppliers' => $query->clone()->where('is_active', true)->count(),
            'suppliers_with_purchases' => $query->clone()->whereHas('purchaseOrders')->count(),
            'purchase_orders' => PurchaseOrder::whereIn(
                'supplier_id',
                $query->clone()->select('id'),
            )->count(),
        ];

        $suppliers = $query->withCount('purchaseOrders')
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
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $suppliers->getCollection()->transform(function (Supplier $supplier): Supplier {
            $supplier->setAttribute('purchase_orders_count', (int) ($supplier->purchase_orders_count ?? 0));
            $supplier->setAttribute('open_purchase_orders_count', (int) ($supplier->open_purchase_orders_count ?? 0));
            // Normalise the decimal sum to a 2dp string regardless of driver.
            $supplier->setAttribute('purchase_value', number_format((float) ($supplier->purchase_value ?? 0), 2, '.', ''));

            return $supplier;
        });

        return Inertia::render('Admin/Reports/Suppliers', [
            'suppliers' => $suppliers,
            'summary' => [
                'suppliers' => (int) $summary['suppliers'],
                'active_suppliers' => (int) $summary['active_suppliers'],
                'suppliers_with_purchases' => (int) $summary['suppliers_with_purchases'],
                'purchase_orders' => (int) $summary['purchase_orders'],
            ],
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Report G — Customer Sales Report.
     *
     * One row per customer (subquery aggregates, never join duplication):
     * order count, delivered order count, Delivered Sales Value (Phase 23
     * scope — cancelled orders are never presented as completed sales),
     * returned quantity (persisted order-line counters) and return value
     * (authoritative SalesReturn totals over the customer's orders). No
     * "customer revenue" labels and no accounting figures.
     *
     * No date filter: aggregates are lifetime figures, matching how the
     * sales-facing pages present customers.
     */
    public function customers(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
        ]);

        $search = $validated['search'] ?? null;

        $query = Customer::query();

        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Summary over the filtered set; the order aggregates reuse the same
        // filtered builder as a subquery so the filters are defined once.
        $summary = [
            'customers' => $query->clone()->count(),
            'customers_with_orders' => $query->clone()->whereHas('orders')->count(),
            'delivered_orders' => Order::whereIn(
                'customer_id',
                $query->clone()->select('id'),
            )->where('status', Order::STATUS_DELIVERED)->count(),
            'delivered_sales_value' => Order::whereIn(
                'customer_id',
                $query->clone()->select('id'),
            )->where('status', Order::STATUS_DELIVERED)->sum('total'),
        ];

        $customers = $query->withCount(['orders', 'orders as delivered_orders_count' => function ($q): void {
            $q->where('status', Order::STATUS_DELIVERED);
        }])
            ->withSum(['orders as delivered_sales_value' => function ($q): void {
                $q->where('status', Order::STATUS_DELIVERED);
            }], 'total')
            // Correlated scalar subqueries: each customer's returned units
            // and return value, without a join that could duplicate rows.
            ->selectSub(function ($q) {
                return $q->from('order_items')
                    ->join('orders', 'orders.id', '=', 'order_items.order_id')
                    ->whereColumn('orders.customer_id', 'customers.id')
                    ->selectRaw('coalesce(sum(order_items.returned_quantity), 0)');
            }, 'returned_units')
            ->selectSub(function ($q) {
                return $q->from('sales_returns')
                    ->join('orders', 'orders.id', '=', 'sales_returns.order_id')
                    ->whereColumn('orders.customer_id', 'customers.id')
                    ->selectRaw('coalesce(sum(sales_returns.total), 0)');
            }, 'return_value')
            ->latest()
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $customers->getCollection()->transform(function (Customer $customer): Customer {
            $customer->setAttribute('name', $customer->company_name ?: $customer->contact_name ?: '—');
            $customer->setAttribute('orders_count', (int) ($customer->orders_count ?? 0));
            $customer->setAttribute('delivered_orders_count', (int) ($customer->delivered_orders_count ?? 0));
            $customer->setAttribute('returned_units', (int) ($customer->returned_units ?? 0));
            // Normalise the decimal sums to 2dp strings regardless of driver.
            $customer->setAttribute('delivered_sales_value', number_format((float) ($customer->delivered_sales_value ?? 0), 2, '.', ''));
            $customer->setAttribute('return_value', number_format((float) ($customer->return_value ?? 0), 2, '.', ''));

            return $customer;
        });

        return Inertia::render('Admin/Reports/Customers', [
            'customers' => $customers,
            'summary' => [
                'customers' => (int) $summary['customers'],
                'customers_with_orders' => (int) $summary['customers_with_orders'],
                'delivered_orders' => (int) $summary['delivered_orders'],
                'delivered_sales_value' => number_format((float) $summary['delivered_sales_value'], 2, '.', ''),
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Inclusive calendar-day range (date(col) >= from and date(col) <= to),
     * so from = to = X selects exactly that whole day regardless of any time
     * component. Only ever applied to a report's own timestamp column.
     */
    private function applyDateRange(Builder $query, string $column, ?string $from, ?string $to): void
    {
        if ($from !== null && $from !== '') {
            $query->whereDate($column, '>=', $from);
        }

        if ($to !== null && $to !== '') {
            $query->whereDate($column, '<=', $to);
        }
    }
}
