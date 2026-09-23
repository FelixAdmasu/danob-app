<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SalesOrderEntryTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    /**
     * Create a variant on a fresh active product (with a category), overriding
     * variant or product attributes as the scenario requires.
     *
     * @param  array<string, mixed>  $variantAttrs
     * @param  array<string, mixed>  $productAttrs
     */
    private function makeVariant(int $quantity = 10, array $variantAttrs = [], array $productAttrs = []): ProductVariant
    {
        $category = Category::create([
            'name' => 'Cat',
            'slug' => 'cat-'.uniqid(),
            'is_active' => true,
        ]);
        $product = Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'P',
            'slug' => 'p-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ], $productAttrs));

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

    /**
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float|string}>  $lines
     * @return array<string, mixed>
     */
    private function storePayload(Customer $customer, array $lines, array $extra = []): array
    {
        return array_merge([
            'customer_id' => $customer->id,
            'notes' => 'Please deliver on time.',
            'intent' => 'create',
            'items' => array_map(fn ($line) => [
                'product_variant_id' => $line[0]->id,
                'quantity' => $line[1],
                'unit_price' => $line[2],
            ], $lines),
        ], $extra);
    }

    public function test_staff_can_view_order_create_form_with_sellable_catalog(): void
    {
        $staff = $this->userWithRole('staff');
        $activeCustomer = $this->makeCustomer(true);
        $this->makeCustomer(false);

        // Active product with one active and one inactive variant.
        $variant = $this->makeVariant(42);
        $variant->product->variants()->create([
            'name' => 'Hidden',
            'quantity' => 7,
            'sku' => 'SKU-HIDDEN-'.uniqid(),
            'is_active' => false,
        ]);
        // Product whose only variant is inactive: nothing to sell, excluded.
        $this->makeVariant(5, ['is_active' => false]);
        // Inactive product with an active variant: excluded by status.
        $this->makeVariant(5, [], ['status' => 'inactive']);

        $this->actingAs($staff)
            ->get(route('admin.orders.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Orders/Create')
                ->has('customers', 1)
                ->where('customers.0.id', $activeCustomer->id)
                ->has('products', 1)
                ->where('products.0.id', $variant->product_id)
                ->has('products.0.variants', 1)
                ->where('products.0.variants.0.sku', $variant->sku)
                // Stock state must never reach order entry: no raw quantity,
                // no derived stock_status, no threshold. (The variant row is
                // proven to exist by the sku assertion above, so a missing key
                // here means it was stripped server-side.)
                ->missing('products.0.variants.0.quantity')
                ->missing('products.0.variants.0.stock_status')
                ->missing('products.0.variants.0.low_stock_threshold'));
    }

    public function test_create_form_search_filters_catalog_database_side(): void
    {
        $staff = $this->userWithRole('staff');
        $this->makeCustomer();

        $variantA = $this->makeVariant(5, ['sku' => 'FINDME-'.uniqid()], ['name' => 'Alpha Product']);
        $this->makeVariant(5, ['sku' => 'UNRELATED-'.uniqid()], ['name' => 'Beta Product']);

        // Match by SKU (variant table LIKE) — only the owning product remains.
        $this->actingAs($staff)
            ->get(route('admin.orders.create', ['search' => $variantA->sku]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Orders/Create')
                ->has('products', 1)
                ->where('products.0.id', $variantA->product_id));

        // Match by product name (products table LIKE).
        $this->actingAs($staff)
            ->get(route('admin.orders.create', ['search' => 'Alpha']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Orders/Create')
                ->has('products', 1)
                ->where('products.0.id', $variantA->product_id));

        // No match — empty bounded result, still a valid page.
        $this->actingAs($staff)
            ->get(route('admin.orders.create', ['search' => 'zzz-no-such-row']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Orders/Create')
                ->has('products', 0));
    }

    public function test_guest_role_user_cannot_create_orders(): void
    {
        $guest = $this->userWithRole('guest');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant();

        $this->actingAs($guest)->get(route('admin.orders.create'))->assertForbidden();
        $this->actingAs($guest)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 1, 10.0]]))
            ->assertForbidden();

        $this->assertSame(0, Order::count());
    }

    public function test_unauthenticated_user_is_redirected_from_order_entry(): void
    {
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant();

        $this->get(route('admin.orders.create'))->assertRedirect(route('login'));
        $this->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 1, 10.0]]))
            ->assertRedirect(route('login'));

        $this->assertSame(0, Order::count());
    }

    public function test_staff_can_create_pending_order_with_computed_totals(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->makeCustomer();
        $variantA = $this->makeVariant(10, ['public_price' => 19.99]);
        $variantB = $this->makeVariant(10, ['public_price' => 5.0]);

        // Client-sent totals are ignored: they are not validated fields and
        // the service recomputes both values in integer cents.
        $response = $this->actingAs($staff)->post(
            route('admin.orders.store'),
            $this->storePayload($customer, [
                [$variantA, 3, 19.99],
                [$variantB, 2, 5.00],
            ], ['subtotal' => '0.01', 'total' => '0.02'])
        );

        $order = Order::firstOrFail();
        $response->assertRedirect(route('admin.orders.show', $order));

        $this->assertSame(Order::STATUS_PENDING, $order->status);
        $this->assertSame('manual', $order->order_source);
        $this->assertSame($customer->id, $order->customer_id);
        $this->assertSame('Please deliver on time.', $order->notes);
        $this->assertMatchesRegularExpression('/^ORD-\d{4}-\d{6}$/', $order->reference_number);
        $this->assertSame(now()->toDateString(), $order->ordered_at->toDateString());

        // 3 x 19.99 = 59.97, 2 x 5.00 = 10.00.
        $this->assertSame('69.97', (string) $order->subtotal);
        $this->assertSame('69.97', (string) $order->total);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'product_variant_id' => $variantA->id,
            'quantity' => 3,
            'unit_price' => '19.99',
            'subtotal' => '59.97',
        ]);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'product_variant_id' => $variantB->id,
            'quantity' => 2,
            'unit_price' => '5.00',
            'subtotal' => '10.00',
        ]);

        // Pending creation must not touch inventory.
        $this->assertSame(10, $variantA->fresh()->quantity);
        $this->assertSame(10, $variantB->fresh()->quantity);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_save_draft_redirects_to_order_index_and_stays_pending(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant(10);

        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 2, 10.0]], ['intent' => 'draft']))
            ->assertRedirect(route('admin.orders.index'));

        // There is no separate draft status: the draft is the same pending order.
        $order = Order::firstOrFail();
        $this->assertSame(Order::STATUS_PENDING, $order->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_store_validates_order_entry_fields(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant();

        // Missing customer.
        $payload = $this->storePayload($customer, [[$variant, 1, 10.0]]);
        unset($payload['customer_id']);
        $this->actingAs($staff)->post(route('admin.orders.store'), $payload)
            ->assertSessionHasErrors('customer_id');

        // Empty items.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [], ['items' => []]))
            ->assertSessionHasErrors('items');

        // Zero quantity.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 0, 10.0]]))
            ->assertSessionHasErrors('items.0.quantity');

        // Negative unit price.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 1, -1.0]]))
            ->assertSessionHasErrors('items.0.unit_price');

        // Nonexistent variant (no ProductVariant factory exists — use a
        // guaranteed-absent primary key so the `exists` rule rejects it).
        $payload = $this->storePayload($customer, [[$variant, 1, 10.0]]);
        $payload['items'][0]['product_variant_id'] = 999999;
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $payload)
            ->assertSessionHasErrors('items.0.product_variant_id');

        // Duplicate variant line (distinct rule).
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 1, 10.0], [$variant, 2, 10.0]]))
            ->assertSessionHasErrors('items.1.product_variant_id');

        // Unknown intent.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 1, 10.0]], ['intent' => 'publish']))
            ->assertSessionHasErrors('intent');

        // Notes over 5000 characters.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 1, 10.0]], ['notes' => str_repeat('x', 5001)]))
            ->assertSessionHasErrors('notes');

        $this->assertSame(0, Order::count());
        $this->assertSame(0, StockMovement::count());
    }

    public function test_duplicate_variant_lines_are_rejected_by_the_service(): void
    {
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant();

        try {
            app(OrderService::class)->create([
                'customer_id' => $customer->id,
                'notes' => null,
                'items' => [
                    ['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_price' => 10.0],
                    ['product_variant_id' => $variant->id, 'quantity' => 2, 'unit_price' => 10.0],
                ],
            ]);
            $this->fail('Expected ValidationException for a duplicate variant line.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('items', $e->errors());
        }

        $this->assertSame(0, Order::count());
        $this->assertSame(10, $variant->fresh()->quantity);
    }

    public function test_inactive_customer_variant_and_product_are_rejected(): void
    {
        $staff = $this->userWithRole('staff');
        $inactiveCustomer = $this->makeCustomer(false);
        $activeCustomer = $this->makeCustomer(true);
        $inactiveVariant = $this->makeVariant(10, ['is_active' => false]);
        $variantOnInactiveProduct = $this->makeVariant(10, [], ['status' => 'inactive']);

        // Inactive customer passes the `exists` rule; the service rejects it.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($inactiveCustomer, [[$inactiveVariant, 1, 10.0]]))
            ->assertSessionHasErrors('customer_id');
        $this->assertSame(0, Order::count());

        // Inactive variant on an active product.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($activeCustomer, [[$inactiveVariant, 1, 10.0]]))
            ->assertSessionHasErrors('items');
        $this->assertSame(0, Order::count());

        // Active variant whose product is not sellable.
        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($activeCustomer, [[$variantOnInactiveProduct, 1, 10.0]]))
            ->assertSessionHasErrors('items');
        $this->assertSame(0, Order::count());

        $this->assertSame(0, StockMovement::count());
    }

    public function test_created_pending_order_confirms_and_deducts_stock_once(): void
    {
        $staff = $this->userWithRole('staff');
        $admin = $this->userWithRole('admin');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant(10);

        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 3, 10.0]]))
            ->assertRedirect();

        $order = Order::firstOrFail();
        $this->assertSame(Order::STATUS_PENDING, $order->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(0, StockMovement::count());

        // Confirmation goes through the existing lifecycle: locks, deduction,
        // sale movement — all inside one transaction.
        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))->assertRedirect();
        $order->refresh();
        $this->assertSame(Order::STATUS_CONFIRMED, $order->status);
        $this->assertSame(7, $variant->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_SALE)->count());

        // Idempotency: a second confirm is rejected without deducting again.
        $this->actingAs($admin)
            ->post(route('admin.orders.confirm', $order))
            ->assertSessionHasErrors('status');
        $order->refresh();
        $this->assertSame(Order::STATUS_CONFIRMED, $order->status);
        $this->assertSame(7, $variant->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_SALE)->count());
    }

    public function test_confirmation_with_insufficient_stock_rolls_back_after_entry(): void
    {
        $admin = $this->userWithRole('admin');
        $staff = $this->userWithRole('staff');
        $customer = $this->makeCustomer();
        $variant = $this->makeVariant(2);

        $this->actingAs($staff)
            ->post(route('admin.orders.store'), $this->storePayload($customer, [[$variant, 5, 10.0]]))
            ->assertRedirect();

        $order = Order::firstOrFail();

        $this->actingAs($admin)
            ->post(route('admin.orders.confirm', $order))
            ->assertSessionHasErrors('quantity');

        // The transaction rolled back: order still pending, stock untouched.
        $order->refresh();
        $this->assertSame(Order::STATUS_PENDING, $order->status);
        $this->assertSame(2, $variant->fresh()->quantity);
        $this->assertSame(0, StockMovement::count());
    }
}
