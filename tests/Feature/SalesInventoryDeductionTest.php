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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SalesInventoryDeductionTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeVariant(int $quantity = 10): ProductVariant
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

        return $product->variants()->create([
            'name' => 'Default',
            'quantity' => $quantity,
            'is_active' => true,
        ]);
    }

    private function makeCustomer(?string $contactName = null): Customer
    {
        return Customer::create([
            'type' => 'individual',
            'contact_name' => $contactName ?? 'C-'.uniqid(),
            'is_active' => true,
        ]);
    }

    /**
     * Build a pending order directly (no order-entry flow exists yet).
     *
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float|string}>  $lines
     */
    private function makePendingOrder(array $lines, ?Customer $customer = null): Order
    {
        $customer ??= $this->makeCustomer();

        $subtotal = 0;
        foreach ($lines as [$variant, $qty, $price]) {
            $subtotal += $qty * (float) $price;
        }

        $order = Order::create([
            'reference_number' => 'ORD-TEST-'.uniqid(),
            'customer_id' => $customer->id,
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => number_format($subtotal, 2, '.', ''),
            'total' => number_format($subtotal, 2, '.', ''),
            'ordered_at' => now()->toDateString(),
        ]);

        foreach ($lines as [$variant, $qty, $price]) {
            $order->items()->create([
                'product_variant_id' => $variant->id,
                'quantity' => $qty,
                'unit_price' => $price,
                'subtotal' => number_format($qty * (float) $price, 2, '.', ''),
            ]);
        }

        return $order;
    }

    // ------------------------------------------------------------------
    // Sales inventory deduction (the core of this phase)
    // ------------------------------------------------------------------

    public function test_confirming_pending_order_deducts_stock_and_creates_sale_movements(): void
    {
        $admin = $this->userWithRole('admin');
        $variantA = $this->makeVariant(10);
        $variantB = $this->makeVariant(5);
        $order = $this->makePendingOrder([
            [$variantA, 4, 25.00],
            [$variantB, 5, 10.00],
        ]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();

        $order->refresh();
        $this->assertSame(Order::STATUS_CONFIRMED, $order->status);
        $this->assertSame(6, $variantA->fresh()->quantity);
        $this->assertSame(0, $variantB->fresh()->quantity);

        $movementA = StockMovement::where('product_variant_id', $variantA->id)->firstOrFail();
        $this->assertSame(StockMovement::TYPE_SALE, $movementA->movement_type);
        $this->assertSame(4, $movementA->quantity);
        $this->assertSame(10, $movementA->quantity_before);
        $this->assertSame(6, $movementA->quantity_after);
        $this->assertSame(Order::class, $movementA->reference_type);
        $this->assertSame($order->id, $movementA->reference_id);
        $this->assertSame($admin->id, $movementA->user_id);
        $this->assertSame('Sale '.$order->reference_number, $movementA->reason);

        $this->assertSame(1, StockMovement::where('product_variant_id', $variantB->id)->count());
        $this->assertSame(2, StockMovement::where('movement_type', StockMovement::TYPE_SALE)->count());
    }

    public function test_confirm_blocks_insufficient_stock_and_rolls_back_entire_order(): void
    {
        $admin = $this->userWithRole('admin');
        $variantA = $this->makeVariant(10); // would succeed on its own
        $variantB = $this->makeVariant(2);  // insufficient for qty 3
        $order = $this->makePendingOrder([
            [$variantA, 5, 20.00],
            [$variantB, 3, 20.00],
        ]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasErrors('quantity');

        $order->refresh();
        $this->assertSame(Order::STATUS_PENDING, $order->status);
        // The first line's deduction must have rolled back with the failure.
        $this->assertSame(10, $variantA->fresh()->quantity);
        $this->assertSame(2, $variantB->fresh()->quantity);
        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    public function test_confirming_twice_never_deducts_stock_twice(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasErrors('status');

        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status);
        $this->assertSame(6, $variant->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_SALE)->count());
    }

    // ------------------------------------------------------------------
    // Lifecycle guards (status flow: pending -> confirmed -> delivered;
    // pending/confirmed -> cancelled — a confirmed cancellation reverses
    // its stock deduction, covered in depth by OrderCancellationTest)
    // ------------------------------------------------------------------

    public function test_cancel_pending_order_leaves_inventory_untouched(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasNoErrors();

        $this->assertSame(Order::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    public function test_cancelling_confirmed_order_restores_the_deducted_stock(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();
        $this->assertSame(6, $variant->fresh()->quantity);

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasNoErrors();

        // The deduction is undone; the original SALE movement stays on record.
        $this->assertSame(Order::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_SALE)->count());
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
    }

    public function test_deliver_is_status_only_and_blocked_from_pending(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $pending = $this->makePendingOrder([[$variant, 1, 5.00]]);
        $order = $this->makePendingOrder([[$variant, 4, 5.00]]);

        // Delivering a pending order is not allowed.
        $this->actingAs($admin)->post(route('admin.orders.deliver', $pending))
            ->assertSessionHasErrors('status');

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();
        $this->assertSame(6, $variant->fresh()->quantity);

        $this->actingAs($admin)->post(route('admin.orders.deliver', $order))
            ->assertSessionHasNoErrors();

        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status);
        // Delivery never changes stock again.
        $this->assertSame(6, $variant->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_SALE)->count());

        // Delivered orders cannot be cancelled either.
        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasErrors('status');
        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status);
    }

    public function test_sequential_sales_chain_movements_correctly(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $orderOne = $this->makePendingOrder([[$variant, 4, 10.00]]);
        $orderTwo = $this->makePendingOrder([[$variant, 3, 10.00]]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $orderOne))
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->post(route('admin.orders.confirm', $orderTwo))
            ->assertSessionHasNoErrors();

        $this->assertSame(3, $variant->fresh()->quantity);

        $movements = StockMovement::where('product_variant_id', $variant->id)
            ->orderBy('id')
            ->get();

        $this->assertSame(2, $movements->count());
        $this->assertSame(4, $movements[0]->quantity);
        $this->assertSame(10, $movements[0]->quantity_before);
        $this->assertSame(6, $movements[0]->quantity_after);
        $this->assertSame($orderOne->id, $movements[0]->reference_id);
        $this->assertSame(3, $movements[1]->quantity);
        $this->assertSame(6, $movements[1]->quantity_before);
        $this->assertSame(3, $movements[1]->quantity_after);
        $this->assertSame($orderTwo->id, $movements[1]->reference_id);
    }

    // ------------------------------------------------------------------
    // Security / RBAC (confirm/cancel/deliver live behind role:admin,manager)
    // ------------------------------------------------------------------

    public function test_guest_cannot_confirm_cancel_or_deliver(): void
    {
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 1, 5.00]]);

        $this->post(route('admin.orders.confirm', $order))->assertRedirect(route('login'));
        $this->post(route('admin.orders.cancel', $order))->assertRedirect(route('login'));
        $this->post(route('admin.orders.deliver', $order))->assertRedirect(route('login'));

        $this->assertSame(Order::STATUS_PENDING, $order->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    public function test_staff_can_view_but_cannot_manage_orders(): void
    {
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 1, 5.00]]);

        $this->actingAs($this->userWithRole('staff'))
            ->get(route('admin.orders.show', $order))
            ->assertOk();

        $this->actingAs($this->userWithRole('staff'))
            ->post(route('admin.orders.confirm', $order))
            ->assertForbidden();
        $this->actingAs($this->userWithRole('staff'))
            ->post(route('admin.orders.cancel', $order))
            ->assertForbidden();
        $this->actingAs($this->userWithRole('staff'))
            ->post(route('admin.orders.deliver', $order))
            ->assertForbidden();

        $this->assertSame(Order::STATUS_PENDING, $order->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    public function test_manager_and_super_admin_can_confirm_orders(): void
    {
        $variant = $this->makeVariant(10);
        $managerOrder = $this->makePendingOrder([[$variant, 2, 10.00]]);
        $superOrder = $this->makePendingOrder([[$variant, 3, 10.00]]);

        $this->actingAs($this->userWithRole('manager'))
            ->post(route('admin.orders.confirm', $managerOrder))
            ->assertSessionHasNoErrors();
        $this->assertSame(Order::STATUS_CONFIRMED, $managerOrder->fresh()->status);

        $this->actingAs($this->userWithRole('super_admin'))
            ->post(route('admin.orders.confirm', $superOrder))
            ->assertSessionHasNoErrors();
        $this->assertSame(Order::STATUS_CONFIRMED, $superOrder->fresh()->status);

        $this->assertSame(5, $variant->fresh()->quantity);
        $this->assertSame(2, StockMovement::where('movement_type', StockMovement::TYPE_SALE)->count());
    }

    // ------------------------------------------------------------------
    // Sales UI / search regression guards
    // ------------------------------------------------------------------

    public function test_show_page_renders_order_with_items_for_staff(): void
    {
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 2, 15.50]]);

        $this->actingAs($this->userWithRole('staff'))
            ->get(route('admin.orders.show', $order))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Orders/Show')
                ->where('order.reference_number', $order->reference_number)
                ->has('order.items', 1)
                ->where('order.items.0.unit_price', '15.50'));
    }

    public function test_orders_search_matches_reference_and_customer_names(): void
    {
        $admin = $this->userWithRole('admin');
        $contact = 'Contact-'.uniqid();
        $customer = $this->makeCustomer($contact);
        $order = $this->makePendingOrder([[$this->makeVariant(1), 1, 5.00]], $customer);

        // Reference search.
        $this->actingAs($admin)
            ->get(route('admin.orders.index', ['search' => $order->reference_number]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('orders.data', 1));

        // Customer contact-name search (customers table has no `name` column).
        $this->actingAs($admin)
            ->get(route('admin.orders.index', ['search' => $contact]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('orders.data', 1));

        // No results still renders fine.
        $this->actingAs($admin)
            ->get(route('admin.orders.index', ['search' => 'nothing-matches-'.uniqid()]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('orders.data', 0));
    }
}
