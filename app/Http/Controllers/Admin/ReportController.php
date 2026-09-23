<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Reports\CustomerReport;
use App\Reports\InventoryMovementReport;
use App\Reports\LowStockReport;
use App\Reports\PurchaseReport;
use App\Reports\ReturnReport;
use App\Reports\SalesReport;
use App\Reports\SupplierReport;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Operational reporting — a read-only window over existing domain data.
 *
 * Reports A–G delegate to the shared App\Reports\* classes, which hold the
 * single business definition per report (validation rules, database-side
 * filters, summaries, computed row columns, deterministic ordering and the
 * CSV columns). The Phase 25 CSV exports in ReportExportController consume
 * those same classes, so a page and its export can never disagree.
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
 * - Queries stay database-side (filters, aggregates, subqueries): no N+1, no
 *   PHP-side filtering of full tables, no caching.
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
     * Report A — Inventory Movements. Rules/filters/summary/row builder:
     * InventoryMovementReport (shared with the CSV export).
     */
    public function inventoryMovements(Request $request)
    {
        $report = new InventoryMovementReport;
        $validated = $request->validate($report->rules());
        $query = $report->query($validated);

        // Summary is computed from the filtered builder BEFORE rows() adds
        // eager loads and computed columns — Phase 24's exact clone timing.
        $summary = $report->summary($query);
        $movements = $report->rows($query)->paginate(20)->withQueryString();
        $movements->getCollection()->transform($report->transformRow(...));

        return Inertia::render('Admin/Reports/InventoryMovements', [
            'movements' => $movements,
            'summary' => $summary,
            'filters' => $report->filters($validated),
            'products' => Product::orderBy('name')->get(['id', 'name']),
            'variants' => ProductVariant::with('product:id,name')->orderBy('name')->get(['id', 'name', 'product_id']),
            'users' => User::orderBy('name')->get(['id', 'name']),
            'movement_types' => StockMovement::TYPES,
        ]);
    }

    /**
     * Report B — Purchases. Rules/filters/summary/row builder:
     * PurchaseReport (shared with the CSV export).
     */
    public function purchases(Request $request)
    {
        $report = new PurchaseReport;
        $validated = $request->validate($report->rules());
        $query = $report->query($validated);

        $summary = $report->summary($query);
        $orders = $report->rows($query)->paginate(20)->withQueryString();
        $orders->getCollection()->transform($report->transformRow(...));

        return Inertia::render('Admin/Reports/Purchases', [
            'purchase_orders' => $orders,
            'summary' => $summary,
            'filters' => $report->filters($validated),
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            'purchase_statuses' => PurchaseOrder::STATUSES,
        ]);
    }

    /**
     * Report C — Sales. Rules/filters/summary/row builder: SalesReport
     * (shared with the CSV export).
     */
    public function sales(Request $request)
    {
        $report = new SalesReport;
        $validated = $request->validate($report->rules());
        $query = $report->query($validated);

        $summary = $report->summary($query);
        $orders = $report->rows($query)->paginate(20)->withQueryString();
        $orders->getCollection()->transform($report->transformRow(...));

        return Inertia::render('Admin/Reports/Sales', [
            'orders' => $orders,
            'summary' => $summary,
            'filters' => $report->filters($validated),
            'customers' => Customer::orderBy('company_name')->orderBy('contact_name')->get(['id', 'company_name', 'contact_name']),
            'order_statuses' => Order::STATUSES,
        ]);
    }

    /**
     * Report D — Sales Returns. Rules/filters/summary/row builder:
     * ReturnReport (shared with the CSV export).
     */
    public function returns(Request $request)
    {
        $report = new ReturnReport;
        $validated = $request->validate($report->rules());
        $query = $report->query($validated);

        $summary = $report->summary($query);
        $returns = $report->rows($query)->paginate(20)->withQueryString();
        $returns->getCollection()->transform($report->transformRow(...));

        return Inertia::render('Admin/Reports/Returns', [
            'returns' => $returns,
            'summary' => $summary,
            'filters' => $report->filters($validated),
            'customers' => Customer::orderBy('company_name')->orderBy('contact_name')->get(['id', 'company_name', 'contact_name']),
            'products' => Product::orderBy('name')->get(['id', 'name']),
            'variants' => ProductVariant::with('product:id,name')->orderBy('name')->get(['id', 'name', 'product_id']),
        ]);
    }

    /**
     * Report E — Low Stock. The Phase 20 semantics (vocabulary, SQL mirror
     * of ProductVariant::stockStatus(), active-only base, summary counts)
     * live verbatim in LowStockReport, shared with the CSV export.
     */
    public function lowStock(Request $request)
    {
        $report = new LowStockReport;
        $validated = $request->validate($report->rules());
        $query = $report->query($validated);

        $counts = $report->summary($query);
        $variants = $report->rows($query)->paginate(20)->withQueryString();

        return Inertia::render('Admin/Reports/LowStock', [
            'variants' => $variants,
            'counts' => $counts,
            'filters' => $report->filters($validated),
        ]);
    }

    /**
     * Report F — Suppliers. Rules/filters/summary/row builder:
     * SupplierReport (shared with the CSV export).
     */
    public function suppliers(Request $request)
    {
        $report = new SupplierReport;
        $validated = $request->validate($report->rules());
        $query = $report->query($validated);

        $summary = $report->summary($query);
        $suppliers = $report->rows($query)->paginate(20)->withQueryString();
        $suppliers->getCollection()->transform($report->transformRow(...));

        return Inertia::render('Admin/Reports/Suppliers', [
            'suppliers' => $suppliers,
            'summary' => $summary,
            'filters' => $report->filters($validated),
        ]);
    }

    /**
     * Report G — Customers. Rules/filters/summary/row builder:
     * CustomerReport (shared with the CSV export).
     */
    public function customers(Request $request)
    {
        $report = new CustomerReport;
        $validated = $request->validate($report->rules());
        $query = $report->query($validated);

        $summary = $report->summary($query);
        $customers = $report->rows($query)->paginate(20)->withQueryString();
        $customers->getCollection()->transform($report->transformRow(...));

        return Inertia::render('Admin/Reports/Customers', [
            'customers' => $customers,
            'summary' => $summary,
            'filters' => $report->filters($validated),
        ]);
    }
}
