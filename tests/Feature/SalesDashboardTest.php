<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SalesReturn;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\OrderService;
use App\Services\SalesReturnService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SalesDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeVariant(int $quantity = 1000): ProductVariant
    {
        $category = Category::create([
            'name' => 'Cat',
            'slug' => 'cat-'.uniqid(),
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'P-'.uniqid(),
            'slug' => 'p-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);

        return $product->variants()->create([
            'name' => 'Default',
            'quantity' => $quantity,
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

    /**
     * Build an order through the real services: pending rows are created
     * directly (no order-entry flow exists yet) and confirmed/delivered/
     * cancelled states are driven through OrderService, so stock movements
     * and statuses match production semantics. Lines are positional tuples
     * [variant, quantity, price].
     *
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float|string}>  $lines
     * @param  array<string, mixed>  $overrides
     */
    private function makeOrder(string $status, array $lines, ?Customer $customer = null, array $overrides = []): Order
    {
        $customer ??= $this->makeCustomer();

        $subtotal = 0;
        foreach ($lines as [$variant, $qty, $price]) {
            $subtotal += $qty * (float) $price;
        }

        $order = Order::create(array_merge([
            'reference_number' => 'ORD-TEST-'.uniqid(),
            'customer_id' => $customer->id,
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => number_format($subtotal, 2, '.', ''),
            'total' => number_format($subtotal, 2, '.', ''),
            'ordered_at' => now()->toDateString(),
        ], $overrides));

        foreach ($lines as [$variant, $qty, $price]) {
            $order->items()->create([
                'product_variant_id' => $variant->id,
                'quantity' => $qty,
                'unit_price' => $price,
                'subtotal' => number_format($qty * (float) $price, 2, '.', ''),
            ]);
        }

        $actor = null;

        if ($status !== Order::STATUS_PENDING) {
            $actor = $this->userWithRole('admin');
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

    private function dashboard(User $user)
    {
        return $this->actingAs($user)->get(route('admin.sales.dashboard'));
    }

    // ------------------------------------------------------------------
    // Summary metrics (§2/§7 scope: no revenue policy exists, so the
    // completed-sales figure is the delivered-order value only)
    // ------------------------------------------------------------------

    public function test_summary_metrics_count_each_order_status(): void
    {
        $variant = $this->makeVariant();
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);
        $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 1, 10.00]]);
        $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 1, 10.00]]);
        $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 1, 10.00]]);

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesDashboard')
            ->where('sales.metrics.total_orders', 4)
            ->where('sales.metrics.pending', 1)
            ->where('sales.metrics.confirmed', 1)
            ->where('sales.metrics.delivered', 1)
            ->where('sales.metrics.cancelled', 1));
    }

    public function test_sales_value_counts_delivered_orders_only_and_reports_each_status_value(): void
    {
        $variant = $this->makeVariant();
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]]);     // 100.00 pipeline
        $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 2, 100.00]]);   // 200.00 pipeline
        $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]]);   // 400.00 completed sale
        $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 5, 100.00]]);   // 500.00 reversed, excluded

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('sales.metrics.delivered_value', '400.00')
            ->where('sales.metrics.pending_value', '100.00')
            ->where('sales.metrics.confirmed_value', '200.00')
            ->where('sales.metrics.cancelled_value', '500.00'));

        // The completed-sales figure is deliberately NOT every order total:
        // summing all persisted totals would be 1200.00.
        $this->assertSame(1200.0, (float) DB::table('orders')->sum('total'));
        $this->assertSame(400.0, (float) DB::table('orders')
            ->where('status', Order::STATUS_DELIVERED)->sum('total'));
    }

    public function test_order_pipeline_lists_every_status_with_count_and_value(): void
    {
        $variant = $this->makeVariant();
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);
        $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 1, 20.00]]);
        $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 1, 40.00]]);
        $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 1, 50.00]]);

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.pipeline', 4)
            ->where('sales.pipeline.0.status', Order::STATUS_PENDING)
            ->where('sales.pipeline.0.count', 1)
            ->where('sales.pipeline.0.value', '10.00')
            ->where('sales.pipeline.1.status', Order::STATUS_CONFIRMED)
            ->where('sales.pipeline.1.count', 1)
            ->where('sales.pipeline.1.value', '20.00')
            ->where('sales.pipeline.2.status', Order::STATUS_DELIVERED)
            ->where('sales.pipeline.2.count', 1)
            ->where('sales.pipeline.2.value', '40.00')
            ->where('sales.pipeline.3.status', Order::STATUS_CANCELLED)
            ->where('sales.pipeline.3.count', 1)
            ->where('sales.pipeline.3.value', '50.00'));
    }

    // ------------------------------------------------------------------
    // Returns (authoritative SalesReturn data, distinct from cancellation)
    // ------------------------------------------------------------------

    public function test_returns_summary_counts_returns_units_and_authoritative_value(): void
    {
        $variant = $this->makeVariant();
        $order = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 5, 20.00]]); // 100.00

        $this->processReturn($order, 3); // 60.00
        $this->processReturn($order, 2); // 40.00

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('sales.returns.count', 2)
            ->where('sales.returns.quantity', 5)
            ->where('sales.returns.value', '100.00'));

        // The dashboard value is the database sum of persisted return totals.
        $this->assertSame(100.0, (float) DB::table('sales_returns')->sum('total'));
    }

    public function test_delivered_order_with_return_stays_delivered_and_cancelled_stays_distinct(): void
    {
        $variant = $this->makeVariant();
        $cancelled = $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 1, 10.00]]);
        $returned = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 3, 10.00]]);
        $this->processReturn($returned, 2);

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('sales.metrics.cancelled', 1)
            ->where('sales.metrics.delivered', 1)
            ->where('sales.returns.count', 1)
            ->where('sales.returns.quantity', 2)
            ->where('sales.returns.value', '20.00'));

        // Reporting never rewrites order status: cancelled is not returned,
        // and a delivered order with a return remains delivered.
        $this->assertSame(Order::STATUS_CANCELLED, $cancelled->fresh()->status);
        $this->assertSame(Order::STATUS_DELIVERED, $returned->fresh()->status);
    }

    // ------------------------------------------------------------------
    // Recent orders
    // ------------------------------------------------------------------

    public function test_recent_orders_render_reference_customer_date_total_status_and_returned_quantity(): void
    {
        $variant = $this->makeVariant();
        $order = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 5, 10.00]], $this->makeCustomer('Acme Ltd'));
        $this->processReturn($order, 2);

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.recent_orders', 1)
            ->where('sales.recent_orders.0.reference_number', $order->reference_number)
            ->where('sales.recent_orders.0.customer.company_name', 'Acme Ltd')
            ->where('sales.recent_orders.0.status', Order::STATUS_DELIVERED)
            ->where('sales.recent_orders.0.total', '50.00')
            ->where('sales.recent_orders.0.returned_quantity', 2)
            ->has('sales.recent_orders.0.ordered_at'));
    }

    public function test_recent_orders_are_ordered_newest_first(): void
    {
        $variant = $this->makeVariant();
        $first = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);
        $second = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);
        $third = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.recent_orders', 3)
            ->where('sales.recent_orders.0.reference_number', $third->reference_number)
            ->where('sales.recent_orders.1.reference_number', $second->reference_number)
            ->where('sales.recent_orders.2.reference_number', $first->reference_number));
    }

    public function test_recent_orders_list_is_limited_to_eight(): void
    {
        $variant = $this->makeVariant();
        for ($i = 0; $i < 10; $i++) {
            $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);
        }

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.recent_orders', 8)
            ->where('sales.metrics.total_orders', 10));
    }

    // ------------------------------------------------------------------
    // Top customers (subquery aggregates — never duplicated rows)
    // ------------------------------------------------------------------

    public function test_top_customers_aggregate_order_counts_delivered_counts_and_value(): void
    {
        $variant = $this->makeVariant();
        $acme = $this->makeCustomer('Acme Ltd');
        $beta = $this->makeCustomer('Beta Ltd');

        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]], $acme);       // 10.00
        $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 1, 40.00]], $acme);     // 40.00
        $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 1, 999.00]], $acme);    // excluded from value
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 20.00]], $beta);       // 20.00

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.top_customers', 2)
            ->where('sales.top_customers.0.id', $acme->id)
            ->where('sales.top_customers.0.name', 'Acme Ltd')
            ->where('sales.top_customers.0.orders_count', 3)
            ->where('sales.top_customers.0.delivered_orders_count', 1)
            ->where('sales.top_customers.0.order_value', '50.00')
            ->where('sales.top_customers.1.id', $beta->id)
            ->where('sales.top_customers.1.name', 'Beta Ltd')
            ->where('sales.top_customers.1.orders_count', 1)
            ->where('sales.top_customers.1.delivered_orders_count', 0)
            ->where('sales.top_customers.1.order_value', '20.00'));
    }

    public function test_top_customers_appear_exactly_once(): void
    {
        $variant = $this->makeVariant();
        $customer = $this->makeCustomer('Solo Ltd');
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]], $customer);
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]], $customer);
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]], $customer);

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.top_customers', 1)
            ->where('sales.top_customers.0.id', $customer->id)
            ->where('sales.top_customers.0.orders_count', 3));
    }

    public function test_top_customers_list_is_limited_to_five(): void
    {
        $variant = $this->makeVariant();
        for ($i = 0; $i < 6; $i++) {
            $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]], $this->makeCustomer('Cust-'.$i));
        }

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.top_customers', 5));
    }

    // ------------------------------------------------------------------
    // Top selling variants (committed sales only, net of returns)
    // ------------------------------------------------------------------

    public function test_top_products_count_committed_sales_only_and_subtract_returns(): void
    {
        $variantA = $this->makeVariant();
        $variantB = $this->makeVariant();

        $this->makeOrder(Order::STATUS_CONFIRMED, [[$variantA, 5, 10.00]]);  // sold
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variantA, 3, 10.00]]); // sold
        $this->makeOrder(Order::STATUS_CANCELLED, [[$variantA, 10, 10.00]]); // reversed — excluded
        $this->makeOrder(Order::STATUS_PENDING, [[$variantA, 7, 10.00]]);    // never deducted — excluded
        $this->processReturn($delivered, 2);                                 // subtracted
        $this->makeOrder(Order::STATUS_PENDING, [[$variantB, 4, 10.00]]);    // no committed sales — absent

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.top_products', 1)
            ->where('sales.top_products.0.variant_id', $variantA->id)
            ->where('sales.top_products.0.product_name', $variantA->product->name)
            ->where('sales.top_products.0.variant_name', $variantA->name)
            ->where('sales.top_products.0.sold_quantity', 8)   // 5 + 3, never 25
            ->where('sales.top_products.0.returned_quantity', 2)
            ->where('sales.top_products.0.net_quantity', 6));
    }

    public function test_top_products_are_ordered_by_sold_quantity_and_limited_to_five(): void
    {
        $expected = [];
        foreach ([6, 5, 4, 3, 2, 1] as $index => $sold) {
            $variant = $this->makeVariant();
            $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, $sold, 10.00]]);
            if ($index < 5) {
                $expected[] = $variant->id;
            }
        }

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.top_products', 5)
            ->where('sales.top_products.0.variant_id', $expected[0])
            ->where('sales.top_products.0.sold_quantity', 6)
            ->where('sales.top_products.4.variant_id', $expected[4])
            ->where('sales.top_products.4.sold_quantity', 2));
    }

    // ------------------------------------------------------------------
    // Sales movement history (existing ledger, sales workflow types only)
    // ------------------------------------------------------------------

    public function test_recent_sales_movements_include_only_sales_workflow_types(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();

        $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 5, 10.00]]);    // sale
        $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 5, 10.00]]);    // sale + cancellation_in
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 5, 10.00]]); // sale
        $this->processReturn($delivered, 2);                                  // return_in
        // Non-sales noise, created last: must never appear.
        app(InventoryService::class)->increase($variant, 25, StockMovement::TYPE_PURCHASE, 'Restock', null, null, null, $admin->id);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.movements', 5)
            // Newest first would be the purchase movement if the filter leaked.
            ->where('sales.movements.0.movement_type', StockMovement::TYPE_RETURN_IN)
            ->where('sales.movements.0.quantity', 2)
            ->where('sales.movements.0.quantity_before', 990)
            ->where('sales.movements.0.quantity_after', 992)
            ->where('sales.movements.0.variant.name', $variant->name)
            ->where('sales.movements.0.variant.product.name', $variant->product->name));

        $this->assertSame(5, StockMovement::whereIn('movement_type', [
            StockMovement::TYPE_SALE,
            StockMovement::TYPE_CANCELLATION_IN,
            StockMovement::TYPE_RETURN_IN,
        ])->count());
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_PURCHASE)->count());
    }

    public function test_recent_sales_movements_are_limited_to_eight(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $inventory = app(InventoryService::class);

        for ($i = 0; $i < 10; $i++) {
            $inventory->decrease($variant, 1, StockMovement::TYPE_SALE, 'Sale bulk', null, null, null, $admin->id);
        }

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.movements', 8)
            ->where('sales.movements.0.movement_type', StockMovement::TYPE_SALE));
    }

    // ------------------------------------------------------------------
    // Data integrity (read-only dashboard: 0 StockMovements, nothing else)
    // ------------------------------------------------------------------

    public function test_dashboard_access_creates_zero_stock_movements_and_preserves_quantities(): void
    {
        $variantA = $this->makeVariant();
        $variantB = $this->makeVariant();
        $variantC = $this->makeVariant();

        $this->makeOrder(Order::STATUS_CONFIRMED, [[$variantA, 5, 10.00]]);
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variantB, 3, 10.00]]);
        $this->processReturn($delivered, 1);
        $this->makeOrder(Order::STATUS_CANCELLED, [[$variantC, 10, 10.00]]);

        $movementsBefore = StockMovement::count();
        $quantitiesBefore = [$variantA->fresh()->quantity, $variantB->fresh()->quantity, $variantC->fresh()->quantity];

        $this->dashboard($this->userWithRole('admin'))->assertOk();

        $this->assertSame($movementsBefore, StockMovement::count());
        $this->assertSame($quantitiesBefore, [
            $variantA->fresh()->quantity,
            $variantB->fresh()->quantity,
            $variantC->fresh()->quantity,
        ]);
    }

    public function test_dashboard_access_preserves_order_statuses_returns_and_counters(): void
    {
        $variant = $this->makeVariant();
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 5, 20.00]]);
        $this->processReturn($delivered, 2);
        $cancelled = $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 1, 10.00]]);
        $pending = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);

        $ordersBefore = DB::table('orders')->orderBy('id')->get(['id', 'status', 'total']);
        $itemsBefore = DB::table('order_items')->orderBy('id')->get(['id', 'quantity', 'returned_quantity']);
        $returnsBefore = DB::table('sales_returns')->orderBy('id')->get();
        $returnItemsBefore = DB::table('sales_return_items')->orderBy('id')->get();
        $customersBefore = Customer::count();
        $returnCountBefore = SalesReturn::count();

        $this->dashboard($this->userWithRole('admin'))->assertOk();

        $this->assertEquals($ordersBefore, DB::table('orders')->orderBy('id')->get(['id', 'status', 'total']));
        $this->assertEquals($itemsBefore, DB::table('order_items')->orderBy('id')->get(['id', 'quantity', 'returned_quantity']));
        $this->assertEquals($returnsBefore, DB::table('sales_returns')->orderBy('id')->get());
        $this->assertEquals($returnItemsBefore, DB::table('sales_return_items')->orderBy('id')->get());
        $this->assertSame($customersBefore, Customer::count());
        $this->assertSame($returnCountBefore, SalesReturn::count());

        $this->assertSame(Order::STATUS_DELIVERED, $delivered->fresh()->status);
        $this->assertSame(Order::STATUS_CANCELLED, $cancelled->fresh()->status);
        $this->assertSame(Order::STATUS_PENDING, $pending->fresh()->status);
        $this->assertSame(2, $delivered->items()->firstOrFail()->returned_quantity);
    }

    // ------------------------------------------------------------------
    // Authorization (route follows the Orders viewing model:
    // role:admin,manager,staff; stock-level data stays admin/manager-only)
    // ------------------------------------------------------------------

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('admin.sales.dashboard'))->assertRedirect(route('login'));
    }

    public function test_staff_can_view_sales_dashboard_without_stock_movements(): void
    {
        $variant = $this->makeVariant();
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);

        $this->dashboard($this->userWithRole('staff'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesDashboard')
            ->has('sales.metrics')
            ->has('sales.recent_orders')
            // quantity_before/after would expose stock levels, which staff
            // cannot reach through the inventory routes.
            ->where('sales.movements', null));
    }

    public function test_manager_receives_sales_movements_payload(): void
    {
        $this->dashboard($this->userWithRole('manager'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesDashboard')
            ->has('sales.movements'));
    }

    public function test_admin_receives_sales_movements_payload(): void
    {
        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesDashboard')
            ->has('sales.metrics')
            ->has('sales.movements'));
    }

    public function test_super_admin_receives_sales_movements_payload(): void
    {
        $this->dashboard($this->userWithRole('super_admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesDashboard')
            ->has('sales.movements'));
    }

    // ------------------------------------------------------------------
    // Cross-feature consistency
    // ------------------------------------------------------------------

    public function test_sales_dashboard_and_orders_index_agree_on_order_status(): void
    {
        $variant = $this->makeVariant();
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]]);
        $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 1, 10.00]]);
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 1, 10.00]]);

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('sales.metrics.total_orders', 3)
            ->where('sales.metrics.delivered', 1));

        $admin = $this->userWithRole('admin');
        $this->actingAs($admin)->get(route('admin.orders.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Orders/Index')
            ->has('orders.data', 3));
        $this->actingAs($admin)->get(route('admin.orders.index', ['status' => Order::STATUS_DELIVERED]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $delivered->id)
                ->where('orders.data.0.status', Order::STATUS_DELIVERED));
    }

    public function test_sales_dashboard_and_order_show_agree_on_return_data(): void
    {
        $variant = $this->makeVariant();
        $order = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 5, 20.00]]);
        $this->processReturn($order, 2); // 40.00

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('sales.returns.count', 1)
            ->where('sales.returns.quantity', 2)
            ->where('sales.returns.value', '40.00'));

        $this->actingAs($this->userWithRole('admin'))
            ->get(route('admin.orders.show', $order))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Orders/Show')
                ->has('order.returns', 1)
                ->where('order.returns.0.total', '40.00')
                ->where('order.items.0.returned_quantity', 2));
    }

    public function test_sales_dashboard_and_inventory_history_agree_on_sales_movement_data(): void
    {
        $variant = $this->makeVariant();
        $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 5, 10.00]]); // 1000 → 995

        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('sales.movements', 1)
            ->where('sales.movements.0.movement_type', StockMovement::TYPE_SALE)
            ->where('sales.movements.0.quantity', 5)
            ->where('sales.movements.0.quantity_before', 1000)
            ->where('sales.movements.0.quantity_after', 995));

        $this->actingAs($this->userWithRole('admin'))
            ->get(route('admin.inventory.history', ['movement_type' => StockMovement::TYPE_SALE]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Inventory/History')
                ->has('movements.data', 1)
                ->where('movements.data.0.movement_type', StockMovement::TYPE_SALE)
                ->where('movements.data.0.quantity', 5)
                ->where('movements.data.0.quantity_before', 1000)
                ->where('movements.data.0.quantity_after', 995));
    }

    // ------------------------------------------------------------------
    // Empty states
    // ------------------------------------------------------------------

    public function test_empty_dashboard_returns_zero_metrics_and_empty_lists(): void
    {
        $this->dashboard($this->userWithRole('admin'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesDashboard')
            ->where('sales.metrics.total_orders', 0)
            ->where('sales.metrics.pending', 0)
            ->where('sales.metrics.confirmed', 0)
            ->where('sales.metrics.delivered', 0)
            ->where('sales.metrics.cancelled', 0)
            ->where('sales.metrics.pending_value', '0.00')
            ->where('sales.metrics.confirmed_value', '0.00')
            ->where('sales.metrics.delivered_value', '0.00')
            ->where('sales.metrics.cancelled_value', '0.00')
            ->has('sales.pipeline', 4)
            ->where('sales.pipeline.0.count', 0)
            ->where('sales.pipeline.0.value', '0.00')
            ->where('sales.returns.count', 0)
            ->where('sales.returns.quantity', 0)
            ->where('sales.returns.value', '0.00')
            ->where('sales.recent_orders', [])
            ->where('sales.top_customers', [])
            ->where('sales.top_products', [])
            ->where('sales.movements', []));
    }
}
