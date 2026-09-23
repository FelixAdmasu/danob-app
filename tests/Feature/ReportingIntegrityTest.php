<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\SalesReturn;
use App\Models\Supplier;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\OrderService;
use App\Services\SalesReturnService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Phase 24 — Operational reporting integrity.
 *
 * Covers the brief's authorization matrix across all eight report routes,
 * the read-only guarantee (§42: reports mutate nothing) and the
 * cross-consistency guarantees (§43: report figures agree with the existing
 * dashboards/pages instead of inventing parallel numbers).
 */
class ReportingIntegrityTest extends TestCase
{
    use RefreshDatabase;

    /** Sales-facing reports every authenticated staff member may open. */
    private const STAFF_ROUTES = [
        'admin.reports.index',
        'admin.reports.sales',
        'admin.reports.returns',
        'admin.reports.customers',
    ];

    /** Inventory/purchasing reports restricted to manager and above. */
    private const MANAGER_ROUTES = [
        'admin.reports.inventory-movements',
        'admin.reports.purchases',
        'admin.reports.low-stock',
        'admin.reports.suppliers',
    ];

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeVariant(int $quantity = 1000, ?int $threshold = null, ?string $productName = null): ProductVariant
    {
        $category = Category::create([
            'name' => 'Cat',
            'slug' => 'cat-'.uniqid(),
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => $productName ?? 'P-'.uniqid(),
            'slug' => 'p-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);

        return $product->variants()->create([
            'name' => 'Default',
            'quantity' => $quantity,
            'low_stock_threshold' => $threshold,
            'is_active' => true,
        ]);
    }

    private function makeCustomer(?string $company = null): Customer
    {
        return Customer::create([
            'type' => 'individual',
            'company_name' => $company,
            'contact_name' => 'C-'.uniqid(),
            'is_active' => true,
        ]);
    }

    private function makeSupplier(bool $active = true): Supplier
    {
        return Supplier::create(['name' => 'Sup-'.uniqid(), 'is_active' => $active]);
    }

    /**
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float}>  $lines
     */
    private function makeOrder(string $status, array $lines, ?Customer $customer = null, array $overrides = []): Order
    {
        $actor = $this->userWithRole('admin');

        $order = Order::create(array_merge([
            'customer_id' => ($customer ?? $this->makeCustomer())->id,
            'reference_number' => 'ORD-'.uniqid(),
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => number_format(array_reduce($lines, fn ($c, $l) => $c + ($l[1] * $l[2]), 0.0), 2, '.', ''),
            'total' => number_format(array_reduce($lines, fn ($c, $l) => $c + ($l[1] * $l[2]), 0.0), 2, '.', ''),
            'notes' => null,
            'ordered_at' => now()->toDateString(),
        ], $overrides));

        foreach ($lines as $line) {
            $order->items()->create([
                'product_variant_id' => $line[0]->id,
                'quantity' => $line[1],
                'unit_price' => number_format($line[2], 2, '.', ''),
                'subtotal' => number_format($line[1] * $line[2], 2, '.', ''),
            ]);
        }

        if ($status !== Order::STATUS_PENDING) {
            app(OrderService::class)->confirm($order, $actor->id);
        }

        if ($status === Order::STATUS_DELIVERED) {
            app(OrderService::class)->deliver($order);
        }

        if ($status === Order::STATUS_CANCELLED) {
            app(OrderService::class)->cancel($order, (int) $actor->id);
        }

        return $order->fresh();
    }

    private function processReturn(Order $order, int $quantity, ?string $notes = null): SalesReturn
    {
        $itemId = (int) $order->items()->orderBy('id')->value('id');

        return app(SalesReturnService::class)->process($order, [
            ['order_item_id' => $itemId, 'quantity' => $quantity],
        ], $notes, $this->userWithRole('admin')->id);
    }

    /**
     * Lines are [quantity, unit_cost, received_quantity?] — same integer-cent
     * rule the purchase dashboard tests use. No stock movement is created.
     *
     * @param  array<int, array{0: int, 1: string, 2?: int}>  $lines
     */
    private function makePo(
        User $admin,
        string $status,
        array $lines,
        ?Supplier $supplier = null,
        array $overrides = [],
    ): PurchaseOrder {
        $subtotalCents = 0;

        $po = PurchaseOrder::create(array_merge([
            'po_number' => 'PO-'.uniqid(),
            'supplier_id' => ($supplier ?? $this->makeSupplier())->id,
            'created_by' => $admin->id,
            'status' => $status,
            'ordered_at' => now()->toDateString(),
        ], $overrides));

        foreach ($lines as $line) {
            $lineCents = $line[0] * (int) round(((float) $line[1]) * 100);
            $subtotalCents += $lineCents;

            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'product_variant_id' => $this->makeVariant()->id,
                'quantity' => $line[0],
                'unit_cost' => $line[1],
                'subtotal' => number_format($lineCents / 100, 2, '.', ''),
                'received_quantity' => $line[2] ?? 0,
            ]);
        }

        $po->update([
            'subtotal' => number_format($subtotalCents / 100, 2, '.', ''),
            'tax' => '0.00',
            'discount' => '0.00',
            'total' => number_format($subtotalCents / 100, 2, '.', ''),
        ]);

        return $po->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    private function props($response): array
    {
        return $response->viewData('page')['props'];
    }

    /**
     * A rich world spanning every report: movements, all order statuses, a
     * return, all purchase statuses, low-stock variants, suppliers, customers.
     */
    private function seedWorld(User $admin): array
    {
        $healthy = $this->makeVariant(1000, null);
        $low = $this->makeVariant(7, 10, 'ProdLow');
        $out = $this->makeVariant(0, null, 'ProdOut');
        $variant = $this->makeVariant();

        app(InventoryService::class)->openingBalance($healthy, 100, $admin->id);
        app(InventoryService::class)->increase($healthy, 10, 'adjustment_in', 'Seed', null, null, null, $admin->id);

        $customer = $this->makeCustomer('Acme Corp');
        $pending = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]], $customer, ['ordered_at' => '2026-04-01']);
        $confirmed = $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 2, 100.00]], $customer, ['ordered_at' => '2026-04-02']);
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $customer, ['ordered_at' => '2026-04-03']);
        $cancelled = $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 5, 100.00]], $customer, ['ordered_at' => '2026-04-04']);
        $return = $this->processReturn($delivered, 2, 'Seeded return');

        $supplier = $this->makeSupplier();
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']], $supplier, ['ordered_at' => '2026-01-05']);
        $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[10, '25.00', 4]], $supplier, ['ordered_at' => '2026-01-10']);
        $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[5, '50.00', 5]], $supplier, ['ordered_at' => '2026-01-15']);
        $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[9, '10.00']], $supplier, ['ordered_at' => '2026-01-20']);

        return compact(
            'healthy', 'low', 'out', 'variant', 'customer',
            'pending', 'confirmed', 'delivered', 'cancelled', 'return', 'supplier'
        );
    }

    // ------------------------------------------------------------------
    // Authorization matrix — every report route x every audience
    // ------------------------------------------------------------------

    public function test_guests_are_redirected_from_every_report_route(): void
    {
        foreach ([...self::STAFF_ROUTES, ...self::MANAGER_ROUTES] as $routeName) {
            $this->get(route($routeName))
                ->assertRedirect(route('login'));
        }
    }

    public function test_staff_can_open_sales_facing_reports_and_are_forbidden_on_the_rest(): void
    {
        $staff = $this->userWithRole('staff');

        foreach (self::STAFF_ROUTES as $routeName) {
            $this->actingAs($staff)->get(route($routeName))->assertOk();
        }

        foreach (self::MANAGER_ROUTES as $routeName) {
            $this->actingAs($staff)->get(route($routeName))->assertForbidden();
        }
    }

    public function test_manager_can_open_every_report_route(): void
    {
        $manager = $this->userWithRole('manager');

        foreach ([...self::STAFF_ROUTES, ...self::MANAGER_ROUTES] as $routeName) {
            $this->actingAs($manager)->get(route($routeName))->assertOk();
        }
    }

    public function test_admin_can_open_every_report_route(): void
    {
        $admin = $this->userWithRole('admin');

        foreach ([...self::STAFF_ROUTES, ...self::MANAGER_ROUTES] as $routeName) {
            $this->actingAs($admin)->get(route($routeName))->assertOk();
        }
    }

    public function test_super_admin_can_open_every_report_route(): void
    {
        $super = $this->userWithRole('super_admin');

        foreach ([...self::STAFF_ROUTES, ...self::MANAGER_ROUTES] as $routeName) {
            $this->actingAs($super)->get(route($routeName))->assertOk();
        }
    }

    // ------------------------------------------------------------------
    // §42 — Read-only: loading every report (with filters) mutates nothing
    // ------------------------------------------------------------------

    public function test_reports_never_write_inventory_orders_returns_purchases_suppliers_or_customers(): void
    {
        $admin = $this->userWithRole('admin');
        $this->seedWorld($admin);

        $movementsBefore = DB::table('stock_movements')->orderBy('id')->get();
        $variantsBefore = DB::table('product_variants')->orderBy('id')->get();
        $ordersBefore = DB::table('orders')->orderBy('id')->get();
        $orderItemsBefore = DB::table('order_items')->orderBy('id')->get();
        $returnsBefore = DB::table('sales_returns')->orderBy('id')->get();
        $returnItemsBefore = DB::table('sales_return_items')->orderBy('id')->get();
        $posBefore = DB::table('purchase_orders')->orderBy('id')->get();
        $poItemsBefore = DB::table('purchase_order_items')->orderBy('id')->get();
        $suppliersBefore = DB::table('suppliers')->orderBy('id')->get();
        $customersBefore = DB::table('customers')->orderBy('id')->get();

        foreach ([
            ['admin.reports.index', []],
            ['admin.reports.inventory-movements', ['movement_type' => 'sale', 'date_from' => '2026-01-01', 'search' => 'Seed']],
            ['admin.reports.purchases', ['status' => 'approved', 'date_from' => '2026-01-01', 'date_to' => '2026-12-31']],
            ['admin.reports.purchases', ['search' => 'Sup-']],
            ['admin.reports.sales', ['status' => 'delivered', 'date_from' => '2026-04-01', 'date_to' => '2026-04-30', 'search' => 'Acme']],
            ['admin.reports.returns', ['date_from' => now()->toDateString(), 'search' => 'RET-']],
            ['admin.reports.low-stock', ['status' => 'monitored', 'search' => 'Prod']],
            ['admin.reports.suppliers', ['status' => 'active', 'search' => 'Sup-']],
            ['admin.reports.customers', ['search' => 'Acme']],
        ] as [$routeName, $query]) {
            $this->actingAs($admin)->get(route($routeName, $query))->assertOk();
        }

        $this->assertSame($movementsBefore->count(), DB::table('stock_movements')->count());
        $this->assertEquals($movementsBefore, DB::table('stock_movements')->orderBy('id')->get());
        $this->assertEquals($variantsBefore, DB::table('product_variants')->orderBy('id')->get());
        $this->assertEquals($ordersBefore, DB::table('orders')->orderBy('id')->get());
        $this->assertEquals($orderItemsBefore, DB::table('order_items')->orderBy('id')->get());
        $this->assertEquals($returnsBefore, DB::table('sales_returns')->orderBy('id')->get());
        $this->assertEquals($returnItemsBefore, DB::table('sales_return_items')->orderBy('id')->get());
        $this->assertEquals($posBefore, DB::table('purchase_orders')->orderBy('id')->get());
        $this->assertEquals($poItemsBefore, DB::table('purchase_order_items')->orderBy('id')->get());
        $this->assertEquals($suppliersBefore, DB::table('suppliers')->orderBy('id')->get());
        $this->assertEquals($customersBefore, DB::table('customers')->orderBy('id')->get());
    }

    // ------------------------------------------------------------------
    // §43 — Cross-consistency: reports agree with existing dashboards/pages
    // ------------------------------------------------------------------

    public function test_sales_report_agrees_with_the_sales_dashboard(): void
    {
        $admin = $this->userWithRole('admin');
        $this->seedWorld($admin);

        $report = $this->props($this->actingAs($admin)->get(route('admin.reports.sales'))->assertOk());
        $dashboard = $this->props($this->actingAs($admin)->get(route('admin.sales.dashboard'))->assertOk());

        // Delivered value: the same operational figure, labelled identically.
        $this->assertSame(
            $dashboard['sales']['metrics']['delivered_value'],
            $report['summary']['delivered_sales_value']
        );
        $this->assertSame('400.00', $report['summary']['delivered_sales_value']);

        // Returns: persisted SalesReturn totals on both sides.
        $this->assertSame(
            $dashboard['sales']['returns']['quantity'],
            $report['summary']['returned_units']
        );
        $this->assertSame(
            $dashboard['sales']['returns']['value'],
            $report['summary']['return_value']
        );
        $this->assertSame('200.00', $report['summary']['return_value']);

        // Status counts partition exactly: 4 orders total.
        $this->assertSame(
            $dashboard['sales']['metrics']['total_orders'],
            $report['summary']['orders']
        );
        $this->assertSame(4, $report['summary']['orders']);
        $this->assertSame(1, $report['summary']['delivered_orders']);

        // The backend-provided vocabulary is the model constant, not a React copy.
        $this->assertSame(Order::STATUSES, $report['order_statuses']);
    }

    public function test_purchases_report_agrees_with_the_purchase_dashboard(): void
    {
        $admin = $this->userWithRole('admin');
        $this->seedWorld($admin);

        $report = $this->props($this->actingAs($admin)->get(route('admin.reports.purchases'))->assertOk());
        $dashboard = $this->props($this->actingAs($admin)->get(route('admin.purchases.dashboard'))->assertOk());

        // Purchase value: Σ total excluding cancelled — identical on both sides.
        $this->assertSame(
            $dashboard['purchases']['metrics']['purchase_value'],
            $report['summary']['purchase_value']
        );
        $this->assertSame('750.00', $report['summary']['purchase_value']);

        // Open orders: ¬(received, cancelled) — approved + partially received.
        $this->assertSame(
            $dashboard['purchases']['metrics']['open'],
            $report['summary']['open_orders']
        );
        $this->assertSame(2, $report['summary']['open_orders']);
        $this->assertSame(4, $report['summary']['purchase_orders']);

        // Outstanding units equal the dashboard's per-order remaining quantities.
        // (Dashboard outstanding excludes received/cancelled; received reports 0
        // remaining on the report side and cancelled is forced to 0, so the
        // sums match.)
        $dashboardOutstanding = $dashboard['purchases']['outstanding'];
        $dashboardSum = is_array($dashboardOutstanding)
            ? array_sum(array_map(fn ($row) => (int) $row['remaining_quantity'], $dashboardOutstanding))
            : (int) $dashboardOutstanding->sum('remaining_quantity');
        $this->assertSame($dashboardSum, $report['summary']['outstanding_units']);
        $this->assertSame(16, $report['summary']['outstanding_units']);

        // Per-row agreement for every order the dashboard lists as outstanding.
        $reportRows = collect($report['purchase_orders']['data'])->keyBy('id');
        $rows = is_array($dashboardOutstanding) ? collect($dashboardOutstanding) : $dashboardOutstanding;
        foreach ($rows as $row) {
            $this->assertTrue($reportRows->has($row['id']));
            $this->assertSame(
                (int) $row['remaining_quantity'],
                (int) $reportRows[$row['id']]['remaining_quantity']
            );
        }

        $this->assertSame(PurchaseOrder::STATUSES, $report['purchase_statuses']);
    }

    public function test_customers_report_agrees_with_the_sales_report_on_delivered_value(): void
    {
        $admin = $this->userWithRole('admin');
        $this->seedWorld($admin);

        $sales = $this->props($this->actingAs($admin)->get(route('admin.reports.sales'))->assertOk());
        $customers = $this->props($this->actingAs($admin)->get(route('admin.reports.customers'))->assertOk());

        // Both reports sum the same delivered orders: identical totals.
        $this->assertSame(
            $sales['summary']['delivered_sales_value'],
            $customers['summary']['delivered_sales_value']
        );
        $this->assertSame('400.00', $customers['summary']['delivered_sales_value']);
        $this->assertSame(
            $sales['summary']['delivered_orders'],
            $customers['summary']['delivered_orders']
        );
        $this->assertSame(1, $customers['summary']['delivered_orders']);
        $this->assertSame(1, $customers['summary']['customers_with_orders']);
        $this->assertSame('Acme Corp', $customers['customers']['data'][0]['name']);
    }

    public function test_low_stock_report_agrees_with_the_phase20_low_stock_page(): void
    {
        $admin = $this->userWithRole('admin');
        $this->seedWorld($admin);

        $report = $this->props($this->actingAs($admin)->get(route('admin.reports.low-stock'))->assertOk());
        $page = $this->props($this->actingAs($admin)->get(route('admin.inventory.low-stock'))->assertOk());

        $this->assertSame($page['counts'], $report['counts']);
        $this->assertSame($page['counts']['low'], $report['counts']['low']);
        $this->assertSame($page['counts']['out'], $report['counts']['out']);
        $this->assertSame($page['counts']['monitored'], $report['counts']['monitored']);

        $reportRows = collect($report['variants']['data'])->keyBy('id');
        foreach ($page['variants']['data'] as $row) {
            $this->assertTrue($reportRows->has($row['id']));
            $this->assertSame($row['stock_status'], $reportRows[$row['id']]['stock_status']);
        }
    }

    public function test_reports_render_the_expected_components(): void
    {
        $admin = $this->userWithRole('admin');

        $components = [
            'admin.reports.index' => 'Admin/Reports/Index',
            'admin.reports.sales' => 'Admin/Reports/Sales',
            'admin.reports.returns' => 'Admin/Reports/Returns',
            'admin.reports.customers' => 'Admin/Reports/Customers',
            'admin.reports.inventory-movements' => 'Admin/Reports/InventoryMovements',
            'admin.reports.purchases' => 'Admin/Reports/Purchases',
            'admin.reports.low-stock' => 'Admin/Reports/LowStock',
            'admin.reports.suppliers' => 'Admin/Reports/Suppliers',
        ];

        foreach ($components as $routeName => $component) {
            $this->actingAs($admin)
                ->get(route($routeName))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component($component));
        }

        // The index exposes its role-gated card groups to the React page.
        // (Breadcrumbs are a client-side .layout property, not server props.)
        $this->actingAs($admin)
            ->get(route('admin.reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('groups', 3));
    }
}
