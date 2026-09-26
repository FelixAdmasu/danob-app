<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Focused coverage for the PostgreSQL reference-number fix: both generators
 * used to run `->lockForUpdate()->count()`, which PostgreSQL rejects with
 * SQLSTATE 0A000 (an aggregate cannot lock rows) while SQLite drops the lock
 * clause entirely — which is why the full suite never caught it.
 */
class ReferenceNumberGenerationTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeVariant(int $quantity = 10, array $variantAttrs = []): ProductVariant
    {
        $category = Category::create([
            'name' => 'Cat',
            'slug' => 'cat-'.uniqid(),
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'P',
            'slug' => 'p-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);

        return $product->variants()->create(array_merge([
            'name' => 'Default',
            'quantity' => $quantity,
            'sku' => 'SKU-'.strtoupper(substr(md5(uniqid('', true)), 0, 8)),
            'public_price' => 19.99,
            'is_active' => true,
        ], $variantAttrs));
    }

    private function makeCustomer(bool $active = true): Customer
    {
        return Customer::create([
            'type' => 'individual',
            'contact_name' => 'C-'.uniqid(),
            'is_active' => $active,
        ]);
    }

    private function makeSupplier(bool $active = true): Supplier
    {
        return Supplier::create(['name' => 'Sup-'.uniqid(), 'is_active' => $active]);
    }

    /**
     * @return array<string, mixed>
     */
    private function orderPayload(Customer $customer, ProductVariant $variant): array
    {
        return [
            'customer_id' => $customer->id,
            'notes' => 'Reference generation.',
            'intent' => 'create',
            'items' => [
                ['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_price' => 10.0],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function poPayload(Supplier $supplier, ProductVariant $variant): array
    {
        return [
            'supplier_id' => $supplier->id,
            'items' => [
                ['product_variant_id' => $variant->id, 'quantity' => 5, 'unit_cost' => 25.0],
            ],
        ];
    }

    /**
     * A bare order row carrying only the reference the sequence must respect.
     */
    private function bareOrder(string $reference, Customer $customer): Order
    {
        return Order::create([
            'reference_number' => $reference,
            'customer_id' => $customer->id,
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => '0.00',
            'total' => '0.00',
            'ordered_at' => now()->toDateString(),
        ]);
    }

    /**
     * A bare purchase order row carrying only the number the sequence must
     * respect (no items, so it can be deleted like a discarded draft).
     */
    private function barePurchaseOrder(string $poNumber, Supplier $supplier, User $admin): PurchaseOrder
    {
        return PurchaseOrder::create([
            'po_number' => $poNumber,
            'supplier_id' => $supplier->id,
            'created_by' => $admin->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'ordered_at' => now()->toDateString(),
            'subtotal' => '0.00',
            'total' => '0.00',
        ]);
    }

    // ------------------------------------------------------------------
    // Sales orders
    // ------------------------------------------------------------------

    public function test_first_order_of_the_year_receives_the_zero_padded_reference(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant();

        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->orderPayload($customer, $variant))
            ->assertRedirect();

        $order = Order::firstOrFail();

        $this->assertSame(sprintf('ORD-%s-000001', date('Y')), $order->reference_number);
        $this->assertMatchesRegularExpression('/^ORD-\d{4}-\d{6}$/', $order->reference_number);
        $this->assertSame(Order::STATUS_PENDING, $order->status);
    }

    public function test_successive_orders_increment_the_sequence_and_stay_distinct(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant();

        foreach (range(1, 3) as $ignored) {
            $this->actingAs($staff)
                ->post(route('admin.orders.store'), $this->orderPayload($customer, $variant))
                ->assertRedirect();
        }

        $references = Order::orderBy('id')->pluck('reference_number')->all();

        $this->assertSame([
            sprintf('ORD-%s-000001', date('Y')),
            sprintf('ORD-%s-000002', date('Y')),
            sprintf('ORD-%s-000003', date('Y')),
        ], $references);
        $this->assertSame($references, array_values(array_unique($references)));
    }

    public function test_next_reference_continues_from_the_highest_row_not_the_row_count(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant();
        $year = date('Y');

        // Three references exist, then the middle one disappears. A
        // count-based sequence would hand out 000003 again — a silent
        // duplicate before this fix, a hard failure once the unique index
        // is in place.
        $this->bareOrder(sprintf('ORD-%s-000001', $year), $customer);
        $this->bareOrder(sprintf('ORD-%s-000002', $year), $customer);
        $this->bareOrder(sprintf('ORD-%s-000003', $year), $customer);
        DB::table('orders')->where('reference_number', sprintf('ORD-%s-000002', $year))->delete();

        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->orderPayload($customer, $variant))
            ->assertRedirect();

        $this->assertSame(
            sprintf('ORD-%s-000004', $year),
            Order::latest('id')->firstOrFail()->reference_number,
        );
    }

    public function test_reference_generation_locks_a_real_row_instead_of_running_an_aggregate(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant();

        $queries = [];
        DB::listen(function ($query) use (&$queries): void {
            $queries[] = $query->sql;
        });

        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->orderPayload($customer, $variant))
            ->assertRedirect();

        // The old `lockForUpdate()->count()` compiled to
        // `select count(*) as "aggregate" ... for update` on PostgreSQL
        // (SQLSTATE 0A000) and to the same aggregate without the lock on
        // SQLite, hiding the bug from this suite.
        $aggregates = array_values(array_filter(
            $queries,
            fn (string $sql): bool => str_contains($sql, 'from "orders"') && str_contains($sql, 'count('),
        ));

        $this->assertSame(
            [],
            $aggregates,
            'Reference generation must never aggregate over orders; it locks rows instead.',
        );

        $anchors = array_values(array_filter(
            $queries,
            fn (string $sql): bool => str_contains($sql, 'from "orders"') && str_contains($sql, 'limit 1'),
        ));

        $this->assertNotEmpty($anchors, 'The sequence must be serialised by locking a real row.');

        if (DB::getDriverName() === 'pgsql') {
            $locked = array_values(array_filter(
                $anchors,
                fn (string $sql): bool => str_contains($sql, 'for update'),
            ));

            $this->assertNotEmpty($locked, 'On PostgreSQL the anchor row must be locked with FOR UPDATE.');
        }
    }

    public function test_orders_reference_number_has_a_unique_database_constraint(): void
    {
        $this->assertTrue(Schema::hasIndex('orders', ['reference_number']));
    }

    public function test_database_rejects_a_duplicate_reference_number(): void
    {
        $customer = $this->makeCustomer();
        $reference = sprintf('ORD-%s-000001', date('Y'));

        $this->bareOrder($reference, $customer);

        try {
            $this->bareOrder($reference, $customer);
            $this->fail('A second order must not be allowed to reuse a reference number.');
        } catch (QueryException $e) {
            // The exact shape the create() retry matches on.
            $message = strtolower($e->getMessage());

            $this->assertStringContainsString('unique', $message);
            $this->assertStringContainsString('reference_number', $message);
        }
    }

    public function test_order_entry_validation_is_still_enforced(): void
    {
        $staff = $this->userWithRole('staff');
        $activeCustomer = $this->makeCustomer(true);
        $inactiveCustomer = $this->makeCustomer(false);
        $activeVariant = $this->makeVariant(10);
        $inactiveVariant = $this->makeVariant(10, ['is_active' => false]);

        // Both rejections happen inside create()'s transaction: they must
        // still surface as validation errors — never as a retry — and must
        // not leave an order (or a consumed reference number) behind.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->orderPayload($inactiveCustomer, $activeVariant))
            ->assertSessionHasErrors('customer_id');
        $this->assertSame(0, Order::count());

        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->orderPayload($activeCustomer, $inactiveVariant))
            ->assertSessionHasErrors('items');
        $this->assertSame(0, Order::count());
    }

    // ------------------------------------------------------------------
    // Purchase orders
    // ------------------------------------------------------------------

    public function test_first_purchase_order_of_the_year_receives_the_zero_padded_number(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant();

        $this->actingAs($admin)
            ->post(route('admin.purchase-orders.store'), $this->poPayload($supplier, $variant))
            ->assertSessionHasNoErrors();

        $po = PurchaseOrder::firstOrFail();

        $this->assertSame(sprintf('PO-%s-000001', date('Y')), $po->po_number);
        $this->assertMatchesRegularExpression('/^PO-\d{4}-\d{6}$/', $po->po_number);
    }

    public function test_successive_purchase_orders_increment_the_sequence_and_stay_distinct(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant();

        foreach (range(1, 3) as $ignored) {
            $this->actingAs($admin)
                ->post(route('admin.purchase-orders.store'), $this->poPayload($supplier, $variant))
                ->assertSessionHasNoErrors();
        }

        $numbers = PurchaseOrder::orderBy('id')->pluck('po_number')->all();

        $this->assertSame([
            sprintf('PO-%s-000001', date('Y')),
            sprintf('PO-%s-000002', date('Y')),
            sprintf('PO-%s-000003', date('Y')),
        ], $numbers);
        $this->assertSame($numbers, array_values(array_unique($numbers)));
    }

    public function test_next_purchase_order_number_continues_from_the_highest_row_not_the_row_count(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant();
        $year = date('Y');

        // A discarded draft leaves a hole in the sequence. Counting rows
        // would hand PO-…-000003 back out and hit the po_number unique
        // index that has existed since the table was created.
        $this->barePurchaseOrder(sprintf('PO-%s-000001', $year), $supplier, $admin);
        $this->barePurchaseOrder(sprintf('PO-%s-000002', $year), $supplier, $admin);
        $this->barePurchaseOrder(sprintf('PO-%s-000003', $year), $supplier, $admin);
        DB::table('purchase_orders')->where('po_number', sprintf('PO-%s-000002', $year))->delete();

        $this->actingAs($admin)
            ->post(route('admin.purchase-orders.store'), $this->poPayload($supplier, $variant))
            ->assertSessionHasNoErrors();

        $this->assertSame(
            sprintf('PO-%s-000004', $year),
            PurchaseOrder::latest('id')->firstOrFail()->po_number,
        );
    }

    public function test_po_number_generation_locks_a_real_row_instead_of_running_an_aggregate(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant();

        $queries = [];
        DB::listen(function ($query) use (&$queries): void {
            $queries[] = $query->sql;
        });

        $this->actingAs($admin)
            ->post(route('admin.purchase-orders.store'), $this->poPayload($supplier, $variant))
            ->assertSessionHasNoErrors();

        $aggregates = array_values(array_filter(
            $queries,
            fn (string $sql): bool => str_contains($sql, 'from "purchase_orders"') && str_contains($sql, 'count('),
        ));

        $this->assertSame(
            [],
            $aggregates,
            'PO number generation must never aggregate over purchase_orders; it locks rows instead.',
        );

        $anchors = array_values(array_filter(
            $queries,
            fn (string $sql): bool => str_contains($sql, 'from "purchase_orders"') && str_contains($sql, 'limit 1'),
        ));

        $this->assertNotEmpty($anchors, 'The sequence must be serialised by locking a real row.');

        if (DB::getDriverName() === 'pgsql') {
            $locked = array_values(array_filter(
                $anchors,
                fn (string $sql): bool => str_contains($sql, 'for update'),
            ));

            $this->assertNotEmpty($locked, 'On PostgreSQL the anchor row must be locked with FOR UPDATE.');
        }
    }

    public function test_purchase_orders_po_number_has_a_unique_database_constraint(): void
    {
        $this->assertTrue(Schema::hasIndex('purchase_orders', ['po_number']));
    }

    public function test_purchase_order_validation_is_still_enforced(): void
    {
        $admin = $this->userWithRole('admin');
        $inactiveSupplier = $this->makeSupplier(false);
        $variant = $this->makeVariant();

        // Inactive supplier passes the `exists` rule; the service rejects it.
        $this->actingAs($admin)
            ->post(route('admin.purchase-orders.store'), $this->poPayload($inactiveSupplier, $variant))
            ->assertSessionHasErrors('supplier_id');
        $this->assertSame(0, PurchaseOrder::count());

        // Negative quantities are still rejected before anything is written.
        $this->actingAs($admin)
            ->post(route('admin.purchase-orders.store'), [
                'supplier_id' => $this->makeSupplier()->id,
                'items' => [
                    ['product_variant_id' => $variant->id, 'quantity' => -1, 'unit_cost' => 25.0],
                ],
            ])
            ->assertSessionHasErrors('items.0.quantity');
        $this->assertSame(0, PurchaseOrder::count());
    }
}
