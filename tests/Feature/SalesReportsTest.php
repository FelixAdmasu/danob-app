<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\OrderService;
use App\Services\SalesReturnService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SalesReportsTest extends TestCase
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

    private function makeCustomer(?string $company = null, array $overrides = []): Customer
    {
        return Customer::create(array_merge([
            'type' => 'individual',
            'company_name' => $company,
            'contact_name' => 'C-'.uniqid(),
            'is_active' => true,
        ], $overrides));
    }

    /**
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float}>  $lines
     */
    private function makeOrder(
        string $status,
        array $lines,
        ?Customer $customer = null,
        array $overrides = [],
    ): Order {
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

    // ------------------------------------------------------------------
    // Report C — Sales
    // ------------------------------------------------------------------

    public function test_rows_show_every_status_return_columns_and_delivered_value_summary(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customer = $this->makeCustomer('Acme Corp');
        $pending = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]], $customer, ['ordered_at' => '2026-04-01']);
        $confirmed = $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 2, 100.00]], $customer, ['ordered_at' => '2026-04-02']);
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $customer, ['ordered_at' => '2026-04-03']);
        $cancelled = $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 5, 100.00]], $customer, ['ordered_at' => '2026-04-04']);
        $this->processReturn($delivered, 2, 'Two damaged');

        $this->actingAs($admin)
            ->get(route('admin.reports.sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Sales')
                ->has('orders.data', 4)
                ->where('orders.data.0.id', $cancelled->id)
                ->where('orders.data.0.status', 'cancelled')
                ->where('orders.data.0.total', '500.00')
                ->where('orders.data.0.returned_quantity', 0)
                ->where('orders.data.0.return_value', '0.00')
                ->where('orders.data.0.customer.company_name', 'Acme Corp')
                ->where('orders.data.1.id', $delivered->id)
                // A return never changes order status: the order stays delivered.
                ->where('orders.data.1.status', 'delivered')
                ->where('orders.data.1.returned_quantity', 2)
                ->where('orders.data.1.return_value', '200.00')
                ->where('orders.data.2.id', $confirmed->id)
                ->where('orders.data.3.id', $pending->id)
                ->where('summary.orders', 4)
                ->where('summary.delivered_orders', 1)
                ->where('summary.delivered_sales_value', '400.00')
                ->where('summary.returned_units', 2)
                ->where('summary.return_value', '200.00')
                ->where('order_statuses', Order::STATUSES)
                ->whereNull('filters.status')
                ->whereNull('filters.customer_id')
                ->whereNull('filters.date_from')
                ->whereNull('filters.date_to')
                ->whereNull('filters.search'));

        // Read-only: after loading the report the persisted state is untouched.
        $this->assertSame('delivered', Order::find($delivered->id)->status);
        $this->assertSame(
            '200.00',
            number_format((float) SalesReturn::sum('total'), 2, '.', '')
        );
        $this->assertSame(2, (int) SalesReturnItem::sum('quantity'));
    }

    public function test_status_filter_returns_only_matching_orders_and_scopes_summary(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $pending = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]]);
        $deliveredA = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]]);
        $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 1, 50.00]]);

        $report = route('admin.reports.sales');

        $this->actingAs($admin)->get($report.'?'.http_build_query(['status' => 'delivered']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 2)
                ->where('summary.orders', 2)
                ->where('summary.delivered_orders', 2)
                ->where('summary.delivered_sales_value', '450.00')
                ->where('filters.status', 'delivered'));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['status' => 'pending']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $pending->id)
                ->where('summary.orders', 1)
                ->where('summary.delivered_orders', 0)
                ->where('summary.delivered_sales_value', '0.00')
                ->where('summary.returned_units', 0)
                ->where('summary.return_value', '0.00')
                ->where('filters.status', 'pending'));

        $this->assertNotNull($deliveredA->id);

        $this->actingAs($admin)
            ->get($report.'?'.http_build_query(['status' => 'not-a-status']))
            ->assertStatus(302)
            ->assertSessionHasErrors('status');
    }

    public function test_date_filters_are_inclusive_on_ordered_at_and_combine_with_status(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $first = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]], null, ['ordered_at' => '2026-04-01']);
        $second = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 1, 100.00]], null, ['ordered_at' => '2026-04-05']);
        $third = $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 1, 100.00]], null, ['ordered_at' => '2026-04-10']);

        $report = route('admin.reports.sales');

        // Both bounds inclusive.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-04-01', 'date_to' => '2026-04-05']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 2)
                ->where('orders.data.0.id', $second->id)
                ->where('orders.data.1.id', $first->id)
                ->where('summary.orders', 2)
                ->where('summary.delivered_sales_value', '100.00')
                ->where('filters.date_from', '2026-04-01')
                ->where('filters.date_to', '2026-04-05'));

        // from only.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-04-06']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $third->id)
                ->where('summary.delivered_sales_value', '0.00'));

        // to only.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_to' => '2026-04-02']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $first->id));

        // No match at all: empty rows, fully zeroed summary.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-05-01', 'date_to' => '2026-05-31']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 0)
                ->where('summary.orders', 0)
                ->where('summary.delivered_orders', 0)
                ->where('summary.delivered_sales_value', '0.00')
                ->where('summary.returned_units', 0)
                ->where('summary.return_value', '0.00'));

        // Date range combined with status: both must apply together.
        $this->actingAs($admin)->get($report.'?'.http_build_query([
            'date_from' => '2026-04-04',
            'date_to' => '2026-04-30',
            'status' => 'delivered',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $second->id)
                ->where('summary.orders', 1)
                ->where('summary.delivered_sales_value', '100.00')
                ->where('filters.status', 'delivered'));

        // Status filter alone would match one order outside the range too.
        $this->assertSame(1, Order::where('status', 'delivered')->whereDate('ordered_at', '>=', '2026-04-04')->count());
    }

    public function test_search_matches_reference_number_or_customer_name(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $zenith = $this->makeCustomer('Zenith Retail');
        $target = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]], $zenith, ['reference_number' => 'ORD-FINDME']);
        $other = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]]);

        $report = route('admin.reports.sales');

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'ORD-FINDME']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $target->id)
                ->where('summary.orders', 1)
                ->where('summary.delivered_sales_value', '0.00')
                ->where('filters.search', 'ORD-FINDME'));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'Zenith']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $target->id)
                ->where('summary.orders', 1));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'no-match-zzz']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 0)
                ->where('summary.orders', 0));

        $this->assertNotNull($other->id);
    }

    public function test_customer_filter_returns_only_that_customers_orders(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customerA = $this->makeCustomer('Alpha Industries');
        $customerB = $this->makeCustomer('Beta Industries');
        $orderA = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 3, 100.00]], $customerA);
        $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 9, 100.00]], $customerB);

        $this->actingAs($admin)
            ->get(route('admin.reports.sales', ['customer_id' => $customerA->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $orderA->id)
                ->where('summary.orders', 1)
                ->where('summary.delivered_orders', 1)
                ->where('summary.delivered_sales_value', '300.00')
                // Query-string filters echo back as strings, not ints.
                ->where('filters.customer_id', (string) $customerA->id));
    }

    public function test_pagination_shows_twenty_per_page_and_filters_survive_page_two(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $ids = [];
        for ($i = 0; $i < 25; $i++) {
            $ids[] = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]])->id;
        }
        $newestFirst = array_reverse($ids);
        $report = route('admin.reports.sales');

        $this->actingAs($admin)->get($report)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 20)
                ->where('orders.current_page', 1)
                ->where('orders.per_page', 20)
                ->where('orders.total', 25)
                ->where('orders.last_page', 2)
                ->where('orders.data.0.id', $newestFirst[0])
                ->where('orders.data.19.id', $newestFirst[19]));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['page' => 2, 'status' => 'pending']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 5)
                ->where('orders.current_page', 2)
                ->where('orders.per_page', 20)
                ->where('orders.total', 25)
                ->where('orders.data.0.id', $newestFirst[20])
                ->where('orders.data.4.id', $newestFirst[24])
                ->where('filters.status', 'pending'));
    }

    public function test_empty_state_returns_zeroed_summary_and_backend_status_vocabulary(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->get(route('admin.reports.sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Sales')
                ->has('orders.data', 0)
                ->where('summary.orders', 0)
                ->where('summary.delivered_orders', 0)
                ->where('summary.delivered_sales_value', '0.00')
                ->where('summary.returned_units', 0)
                ->where('summary.return_value', '0.00')
                ->where('order_statuses', Order::STATUSES)
                ->where('customers', []));
    }

    // ------------------------------------------------------------------
    // Report D — Returns
    // ------------------------------------------------------------------

    public function test_return_rows_show_persisted_details_and_summary_matches_db(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customer = $this->makeCustomer('Acme Corp');
        $orderA = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $customer);
        $orderB = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 3, 50.00]], $customer);
        $returnA = $this->processReturn($orderA, 2, 'Damaged in transit');
        $returnB = $this->processReturn($orderB, 1);

        $this->actingAs($admin)
            ->get(route('admin.reports.returns'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Returns')
                ->has('returns.data', 2)
                ->where('returns.data.0.id', $returnB->id)
                ->where('returns.data.0.return_number', $returnB->return_number)
                ->where('returns.data.0.order.reference_number', $orderB->reference_number)
                ->where('returns.data.0.order.customer.company_name', 'Acme Corp')
                // Relations serialize snake_case (HasAttributes::$snakeAttributes).
                ->where('returns.data.0.returned_by.name', $returnB->returnedBy->name)
                ->where('returns.data.0.returned_quantity', 1)
                ->where('returns.data.0.total', '50.00')
                ->where('returns.data.0.notes', null)
                ->where('returns.data.1.id', $returnA->id)
                ->where('returns.data.1.returned_quantity', 2)
                ->where('returns.data.1.total', '200.00')
                ->where('returns.data.1.notes', 'Damaged in transit')
                ->where('returns.data.1.order.reference_number', $orderA->reference_number)
                ->where('summary.return_count', 2)
                ->where('summary.returned_units', 3)
                ->where('summary.return_value', '250.00')
                ->whereNull('filters.customer_id')
                ->whereNull('filters.product_id')
                ->whereNull('filters.variant_id')
                ->whereNull('filters.date_from')
                ->whereNull('filters.date_to')
                ->whereNull('filters.search'));

        // The summary equals the persisted SalesReturn totals — never recalculated.
        $this->assertSame('250.00', number_format((float) SalesReturn::sum('total'), 2, '.', ''));
        $this->assertSame(3, (int) SalesReturnItem::sum('quantity'));
        // A return never changes the order status.
        $this->assertSame('delivered', Order::find($orderA->id)->status);
    }

    public function test_customer_filter_resolves_through_the_order(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customerA = $this->makeCustomer('Alpha Industries');
        $customerB = $this->makeCustomer('Beta Industries');
        $orderA = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 2, 100.00]], $customerA);
        $orderB = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 6, 100.00]], $customerB);
        $returnA = $this->processReturn($orderA, 1);
        $this->processReturn($orderB, 3);

        $this->actingAs($admin)
            ->get(route('admin.reports.returns', ['customer_id' => $customerA->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $returnA->id)
                ->where('summary.return_count', 1)
                ->where('summary.returned_units', 1)
                ->where('summary.return_value', '100.00')
                ->where('filters.customer_id', (string) $customerA->id));
    }

    public function test_product_and_variant_filters_resolve_through_return_items(): void
    {
        $admin = $this->userWithRole('admin');
        $variantA = $this->makeVariant();
        $variantB = $this->makeVariant();
        $order = $this->makeOrder(Order::STATUS_DELIVERED, [[$variantA, 5, 100.00], [$variantB, 7, 10.00]]);
        $itemId = (int) $order->items()->where('product_variant_id', $variantA->id)->value('id');
        $return = app(SalesReturnService::class)->process($order, [
            ['order_item_id' => $itemId, 'quantity' => 2],
        ], null, $this->userWithRole('admin')->id);

        $report = route('admin.reports.returns');

        $this->actingAs($admin)->get($report.'?'.http_build_query(['variant_id' => $variantA->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $return->id)
                ->where('summary.return_count', 1)
                ->where('summary.returned_units', 2)
                ->where('filters.variant_id', (string) $variantA->id));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['product_id' => $variantA->product_id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('summary.return_count', 1)
                ->where('filters.product_id', (string) $variantA->product_id));

        // The other product has no returns: empty rows and a zeroed summary.
        $otherProduct = $variantB->product;
        $this->actingAs($admin)->get($report.'?'.http_build_query(['product_id' => $otherProduct->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 0)
                ->where('summary.return_count', 0)
                ->where('summary.returned_units', 0)
                ->where('summary.return_value', '0.00'));
    }

    public function test_search_matches_return_number_order_reference_or_customer(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $zenith = $this->makeCustomer('Zenith Retail');
        $orderA = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $zenith, ['reference_number' => 'ORD-RET-FIND']);
        $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]]);
        $returnA = $this->processReturn($orderA, 1);

        $report = route('admin.reports.returns');

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => $returnA->return_number]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $returnA->id)
                ->where('summary.return_count', 1)
                ->where('filters.search', $returnA->return_number));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'ORD-RET-FIND']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $returnA->id)
                ->where('summary.return_count', 1));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'Zenith']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $returnA->id));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'no-match-zzz']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 0)
                ->where('summary.return_count', 0)
                ->where('summary.returned_units', 0)
                ->where('summary.return_value', '0.00'));
    }

    public function test_date_filters_are_inclusive_on_returned_at_and_combine_with_customer(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customer = $this->makeCustomer();
        $order = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 10, 100.00]], $customer);
        $returnA = $this->processReturn($order, 1);
        $returnB = $this->processReturn($order, 1);
        SalesReturn::where('id', $returnA->id)->update(['returned_at' => '2026-01-10']);
        SalesReturn::where('id', $returnB->id)->update(['returned_at' => '2026-01-15']);

        $report = route('admin.reports.returns');

        // Both bounds inclusive: each bound's own date is included.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-01-10', 'date_to' => '2026-01-10']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $returnA->id)
                ->where('summary.return_count', 1)
                ->where('summary.return_value', '100.00')
                ->where('filters.date_from', '2026-01-10')
                ->where('filters.date_to', '2026-01-10'));

        // from only — the later return is in range, the earlier one is before it.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-01-12']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $returnB->id)
                ->where('summary.return_count', 1));

        // to only.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_to' => '2026-01-12']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $returnA->id)
                ->where('summary.return_count', 1));

        // No match: empty rows, zeroed summary.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-02-01', 'date_to' => '2026-02-28']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 0)
                ->where('summary.return_count', 0)
                ->where('summary.returned_units', 0)
                ->where('summary.return_value', '0.00'));

        // Date range combined with a customer filter: both must apply.
        $this->actingAs($admin)->get($report.'?'.http_build_query([
            'date_from' => '2026-01-14',
            'date_to' => '2026-01-31',
            'customer_id' => $customer->id,
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 1)
                ->where('returns.data.0.id', $returnB->id)
                ->where('summary.return_count', 1)
                ->where('filters.customer_id', (string) $customer->id));

        // The same customer with a range excluding both returns yields nothing.
        $this->actingAs($admin)->get($report.'?'.http_build_query([
            'date_from' => '2026-03-01',
            'date_to' => '2026-03-31',
            'customer_id' => $customer->id,
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 0)
                ->where('summary.return_count', 0));
    }

    public function test_pagination_shows_twenty_returns_per_page_and_filters_survive(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customer = $this->makeCustomer();
        $ids = [];
        for ($i = 0; $i < 25; $i++) {
            $order = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 2, 10.00]], $customer);
            $ids[] = $this->processReturn($order, 1)->id;
        }
        // returned_at is identical, so id descending decides the order.
        $newestFirst = array_reverse($ids);
        $report = route('admin.reports.returns');

        $this->actingAs($admin)->get($report.'?'.http_build_query(['customer_id' => $customer->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 20)
                ->where('returns.current_page', 1)
                ->where('returns.per_page', 20)
                ->where('returns.total', 25)
                ->where('returns.last_page', 2)
                ->where('returns.data.0.id', $newestFirst[0])
                ->where('returns.data.19.id', $newestFirst[19])
                ->where('filters.customer_id', (string) $customer->id));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['page' => 2, 'customer_id' => $customer->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('returns.data', 5)
                ->where('returns.current_page', 2)
                ->where('returns.per_page', 20)
                ->where('returns.total', 25)
                ->where('returns.data.0.id', $newestFirst[20])
                ->where('returns.data.4.id', $newestFirst[24])
                ->where('filters.customer_id', (string) $customer->id));
    }

    public function test_empty_returns_state_returns_zeroed_summary(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->get(route('admin.reports.returns'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Returns')
                ->has('returns.data', 0)
                ->where('summary.return_count', 0)
                ->where('summary.returned_units', 0)
                ->where('summary.return_value', '0.00')
                ->where('customers', []));
    }

    // ------------------------------------------------------------------
    // Report G — Customers
    // ------------------------------------------------------------------

    public function test_customer_rows_aggregate_orders_value_and_returns_without_duplication(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $acme = $this->makeCustomer('Acme Corp');
        $contactOnly = $this->makeCustomer();
        $unnamed = Customer::create(['type' => 'individual', 'is_active' => true]);
        $noOrders = $this->makeCustomer('Idle Traders');

        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]], $acme);
        $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 5, 100.00]], $acme);
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $acme);
        $this->processReturn($delivered, 2);

        // One row per customer even though Acme has three orders (no join fan-out).
        // Name fallback: company_name ?: contact_name ?: em dash.
        $this->actingAs($admin)
            ->get(route('admin.reports.customers'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Customers')
                ->has('customers.data', 4)
                ->where('customers.data.0.id', $noOrders->id)
                ->where('customers.data.0.name', 'Idle Traders')
                ->where('customers.data.0.orders_count', 0)
                ->where('customers.data.0.delivered_orders_count', 0)
                ->where('customers.data.0.delivered_sales_value', '0.00')
                ->where('customers.data.0.returned_units', 0)
                ->where('customers.data.0.return_value', '0.00')
                ->where('customers.data.1.id', $unnamed->id)
                ->where('customers.data.1.name', '—')
                ->where('customers.data.2.id', $contactOnly->id)
                ->where('customers.data.2.name', $contactOnly->contact_name)
                ->where('customers.data.3.id', $acme->id)
                ->where('customers.data.3.name', 'Acme Corp')
                ->where('customers.data.3.orders_count', 3)
                ->where('customers.data.3.delivered_orders_count', 1)
                ->where('customers.data.3.delivered_sales_value', '400.00')
                ->where('customers.data.3.returned_units', 2)
                ->where('customers.data.3.return_value', '200.00')
                ->where('summary.customers', 4)
                ->where('summary.customers_with_orders', 1)
                ->where('summary.delivered_orders', 1)
                ->where('summary.delivered_sales_value', '400.00')
                ->whereNull('filters.search'));

        $this->assertSame('delivered', Order::find($delivered->id)->status);
    }

    public function test_search_filters_company_contact_email_or_phone_with_scoped_summary(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $findable = $this->makeCustomer('Zenith Retail', [
            'phone' => '0799988877',
            'email' => 'buyer@zenith.test',
        ]);
        $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $findable);
        $this->makeCustomer('Acme Parts');

        $report = route('admin.reports.customers');

        $searches = ['Zenith', 'buyer@zenith', '0799988877'];
        foreach ($searches as $search) {
            $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => $search]))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->has('customers.data', 1)
                    ->where('customers.data.0.id', $findable->id)
                    ->where('summary.customers', 1)
                    ->where('summary.customers_with_orders', 1)
                    ->where('summary.delivered_orders', 1)
                    ->where('summary.delivered_sales_value', '400.00')
                    ->where('filters.search', $search));
        }

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'no-match-zzz']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('customers.data', 0)
                ->where('summary.customers', 0)
                ->where('summary.customers_with_orders', 0)
                ->where('summary.delivered_orders', 0)
                ->where('summary.delivered_sales_value', '0.00'));
    }

    public function test_contact_name_search_matches_without_a_company_name(): void
    {
        $admin = $this->userWithRole('admin');
        $contactOnly = $this->makeCustomer(null, ['contact_name' => 'Dana Wilde']);
        $this->makeCustomer('Other Co');

        $this->actingAs($admin)
            ->get(route('admin.reports.customers', ['search' => 'Dana Wilde']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('customers.data', 1)
                ->where('customers.data.0.id', $contactOnly->id)
                ->where('customers.data.0.name', 'Dana Wilde')
                ->where('summary.customers', 1)
                ->where('summary.customers_with_orders', 0)
                ->where('filters.search', 'Dana Wilde'));
    }

    public function test_pagination_shows_twenty_customers_per_page_and_search_survives(): void
    {
        $admin = $this->userWithRole('admin');
        $ids = [];
        for ($i = 0; $i < 25; $i++) {
            $ids[] = $this->makeCustomer('Findable Co '.$i)->id;
        }
        $this->makeCustomer('Unrelated Traders');
        $newestFirst = array_reverse($ids);
        $report = route('admin.reports.customers');

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'Findable']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('customers.data', 20)
                ->where('customers.current_page', 1)
                ->where('customers.per_page', 20)
                ->where('customers.total', 25)
                ->where('customers.last_page', 2)
                ->where('customers.data.0.id', $newestFirst[0])
                ->where('customers.data.19.id', $newestFirst[19])
                ->where('filters.search', 'Findable'));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['page' => 2, 'search' => 'Findable']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('customers.data', 5)
                ->where('customers.current_page', 2)
                ->where('customers.per_page', 20)
                ->where('customers.total', 25)
                ->where('customers.data.0.id', $newestFirst[20])
                ->where('customers.data.4.id', $newestFirst[24])
                ->where('filters.search', 'Findable'));
    }

    public function test_empty_customers_state_returns_zeroed_summary(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->get(route('admin.reports.customers'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Customers')
                ->has('customers.data', 0)
                ->where('summary.customers', 0)
                ->where('summary.customers_with_orders', 0)
                ->where('summary.delivered_orders', 0)
                ->where('summary.delivered_sales_value', '0.00'));
    }

    // ------------------------------------------------------------------
    // Read-only guarantee: sales reports never write anything
    // ------------------------------------------------------------------

    public function test_sales_reports_create_no_movements_and_do_not_change_orders_returns_or_quantities(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customer = $this->makeCustomer('Acme Corp');
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $customer);
        $pending = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]], $customer);
        $return = $this->processReturn($delivered, 1);

        $movementsBefore = StockMovement::count();
        $statusesBefore = Order::orderBy('id')->pluck('status', 'id');
        $returnedBefore = DB::table('order_items')->orderBy('id')->pluck('returned_quantity', 'id');
        $quantitiesBefore = DB::table('product_variants')->orderBy('id')->pluck('quantity', 'id');
        $returnsBefore = SalesReturn::orderBy('id')->get(['id', 'total', 'returned_at'])->toArray();
        $customersBefore = Customer::orderBy('id')->get()->toArray();

        foreach ([
            ['admin.reports.sales', ['status' => 'delivered', 'date_from' => '2026-01-01']],
            ['admin.reports.sales', ['search' => 'Acme']],
            ['admin.reports.returns', ['customer_id' => $customer->id, 'date_to' => now()->toDateString()]],
            ['admin.reports.returns', ['search' => 'RET-']],
            ['admin.reports.customers', ['search' => 'Acme']],
            ['admin.reports.index', []],
        ] as [$routeName, $query]) {
            $this->actingAs($admin)->get(route($routeName, $query))->assertOk();
        }

        $this->assertSame($movementsBefore, StockMovement::count());
        $this->assertEquals($statusesBefore, Order::orderBy('id')->pluck('status', 'id'));
        $this->assertEquals($returnedBefore, DB::table('order_items')->orderBy('id')->pluck('returned_quantity', 'id'));
        $this->assertEquals($quantitiesBefore, DB::table('product_variants')->orderBy('id')->pluck('quantity', 'id'));
        $this->assertEquals($returnsBefore, SalesReturn::orderBy('id')->get(['id', 'total', 'returned_at'])->toArray());
        $this->assertEquals($customersBefore, Customer::orderBy('id')->get()->toArray());
        $this->assertSame('delivered', Order::find($delivered->id)->status);
        $this->assertSame('pending', Order::find($pending->id)->status);
        $this->assertSame(1, (int) SalesReturnItem::where('sales_return_id', $return->id)->sum('quantity'));
    }
}
