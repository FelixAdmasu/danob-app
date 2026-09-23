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
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesReturnTest extends TestCase
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

    private function makeCustomer(): Customer
    {
        return Customer::create([
            'type' => 'individual',
            'contact_name' => 'C-'.uniqid(),
            'is_active' => true,
        ]);
    }

    /**
     * Build a pending order directly (no order-entry flow exists yet).
     *
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float|string}>  $lines
     */
    private function makePendingOrder(array $lines): Order
    {
        $customer = $this->makeCustomer();

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

    /**
     * Drive an order to `delivered` through the real services (no HTTP, so no
     * authenticated guard state leaks into RBAC tests).
     *
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float|string}>  $lines
     */
    private function makeDeliveredOrder(array $lines): Order
    {
        $order = $this->makePendingOrder($lines);
        $service = app(OrderService::class);
        $service->confirm($order, $this->userWithRole('admin')->id);
        $service->deliver($order);

        return $order->fresh();
    }

    // ------------------------------------------------------------------
    // Core return: stock restoration + auditable ledger
    // (ledger example: 100 -> sale -20 -> 80 -> return +20 -> 100)
    // ------------------------------------------------------------------

    public function test_returning_delivered_order_restores_stock_and_creates_return_movement(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makeDeliveredOrder([[$variant, 20, 10.00]]);
        $this->assertSame(80, $variant->fresh()->quantity);

        $response = $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [['order_item_id' => $order->items()->firstOrFail()->id, 'quantity' => 20]],
            ]);
        $response->assertSessionHasNoErrors();

        $salesReturn = SalesReturn::firstOrFail();
        $response->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Return '.$salesReturn->return_number.' processed. Stock restored.',
        ]);

        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status);
        $this->assertSame(100, $variant->fresh()->quantity);
        $this->assertSame($order->id, $salesReturn->order_id);
        $this->assertSame($admin->id, $salesReturn->returned_by);
        $this->assertSame('200.00', $salesReturn->total);

        $returnItem = $salesReturn->items()->firstOrFail();
        $this->assertSame(20, $returnItem->quantity);
        $this->assertSame('10.00', $returnItem->unit_price);
        $this->assertSame('200.00', $returnItem->subtotal);
        $this->assertSame(20, $order->items()->firstOrFail()->returned_quantity);

        $movements = StockMovement::where('product_variant_id', $variant->id)
            ->orderBy('id')
            ->get();
        $this->assertSame(2, $movements->count());

        // The original SALE movement is never rewritten.
        $sale = $movements[0];
        $this->assertSame(StockMovement::TYPE_SALE, $sale->movement_type);
        $this->assertSame(20, $sale->quantity);
        $this->assertSame(100, $sale->quantity_before);
        $this->assertSame(80, $sale->quantity_after);

        // A NEW compensating return movement records the restoration.
        $return = $movements[1];
        $this->assertSame(StockMovement::TYPE_RETURN_IN, $return->movement_type);
        $this->assertSame(20, $return->quantity);
        $this->assertSame(80, $return->quantity_before);
        $this->assertSame(100, $return->quantity_after);
        $this->assertSame(SalesReturn::class, $return->reference_type);
        $this->assertSame($salesReturn->id, $return->reference_id);
        $this->assertSame($admin->id, $return->user_id);
        $this->assertSame(
            'Sales return '.$salesReturn->return_number.' for '.$order->reference_number,
            $return->reason,
        );
    }

    // ------------------------------------------------------------------
    // Partial returns: capped at the remaining returnable quantity
    // ------------------------------------------------------------------

    public function test_partial_returns_are_capped_at_remaining_quantity(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makeDeliveredOrder([[$variant, 5, 20.00]]);
        $itemId = $order->items()->firstOrFail()->id;
        $this->assertSame(5, $variant->fresh()->quantity);

        // Return 3 of 5.
        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [['order_item_id' => $itemId, 'quantity' => 3]],
            ])
            ->assertSessionHasNoErrors();
        $this->assertSame(8, $variant->fresh()->quantity);
        $this->assertSame(3, $order->items()->firstOrFail()->returned_quantity);

        // Only 2 remaining — another 3 is rejected and fully rolled back.
        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [['order_item_id' => $itemId, 'quantity' => 3]],
            ])
            ->assertSessionHasErrors('quantity');
        $this->assertSame(8, $variant->fresh()->quantity);
        $this->assertSame(3, $order->items()->firstOrFail()->returned_quantity);
        $this->assertSame(1, SalesReturn::count());

        // The final 2 complete the return.
        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [['order_item_id' => $itemId, 'quantity' => 2]],
            ])
            ->assertSessionHasNoErrors();
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(5, $order->items()->firstOrFail()->returned_quantity);
        $this->assertSame(2, SalesReturn::count());

        // Nothing left: the return page redirects back with a clear message.
        $this->actingAs($admin)
            ->get(route('admin.orders.process-return', $order))
            ->assertRedirect(route('admin.orders.show', $order))
            ->assertInertiaFlash('toast', [
                'type' => 'error',
                'message' => 'All items on this order have already been returned.',
            ]);
    }

    // ------------------------------------------------------------------
    // Returns apply to delivered orders only (separate from cancellation)
    // ------------------------------------------------------------------

    public function test_return_blocked_for_non_delivered_orders(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $pending = $this->makePendingOrder([[$variant, 4, 15.00]]);
        $confirmed = $this->makePendingOrder([[$variant, 4, 15.00]]);
        $cancelled = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $confirmed));
        $this->actingAs($admin)->post(route('admin.orders.cancel', $cancelled));

        foreach ([$pending, $confirmed, $cancelled] as $order) {
            $this->actingAs($admin)
                ->post(route('admin.orders.process-return.store', $order), [
                    'items' => [['order_item_id' => $order->items()->firstOrFail()->id, 'quantity' => 1]],
                ])
                ->assertSessionHasErrors('order');
        }

        $this->assertSame(Order::STATUS_PENDING, $pending->fresh()->status);
        $this->assertSame(Order::STATUS_CONFIRMED, $confirmed->fresh()->status);
        $this->assertSame(Order::STATUS_CANCELLED, $cancelled->fresh()->status);
        // Pending/cancelled stock untouched; the confirmed deduction stands (10 - 4).
        $this->assertSame(6, $variant->fresh()->quantity);
        $this->assertSame(0, StockMovement::where('movement_type', StockMovement::TYPE_RETURN_IN)->count());
        $this->assertSame(0, SalesReturn::count());
    }

    public function test_multi_line_return_restores_every_line(): void
    {
        $admin = $this->userWithRole('admin');
        $variantA = $this->makeVariant(10);
        $variantB = $this->makeVariant(20);
        $order = $this->makeDeliveredOrder([
            [$variantA, 3, 25.00],
            [$variantB, 5, 10.00],
        ]);
        $this->assertSame(7, $variantA->fresh()->quantity);
        $this->assertSame(15, $variantB->fresh()->quantity);

        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [
                    ['order_item_id' => $order->items()->orderBy('id')->pluck('id')[0], 'quantity' => 3],
                    ['order_item_id' => $order->items()->orderBy('id')->pluck('id')[1], 'quantity' => 5],
                ],
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(10, $variantA->fresh()->quantity);
        $this->assertSame(20, $variantB->fresh()->quantity);
        // 3 × 25.00 + 5 × 10.00 = 125.00
        $this->assertSame('125.00', SalesReturn::firstOrFail()->total);
        $this->assertSame(2, SalesReturn::firstOrFail()->items()->count());
        $this->assertSame(1, StockMovement::where('product_variant_id', $variantA->id)
            ->where('movement_type', StockMovement::TYPE_RETURN_IN)->count());
        $this->assertSame(1, StockMovement::where('product_variant_id', $variantB->id)
            ->where('movement_type', StockMovement::TYPE_RETURN_IN)->count());
    }

    // ------------------------------------------------------------------
    // Atomicity: one failing line rolls back the entire return
    // ------------------------------------------------------------------

    public function test_return_fails_atomically_when_one_line_exceeds_remaining(): void
    {
        $admin = $this->userWithRole('admin');
        $variantA = $this->makeVariant(10);
        $variantB = $this->makeVariant(20);
        $order = $this->makeDeliveredOrder([
            [$variantA, 5, 25.00],
            [$variantB, 5, 10.00],
        ]);
        $items = $order->items()->orderBy('id')->get();
        $this->assertSame(5, $variantA->fresh()->quantity);
        $this->assertSame(15, $variantB->fresh()->quantity);

        // Line A is valid (2 of 5); line B exceeds its remaining 5 — the
        // failure must roll back line A's restoration too.
        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [
                    ['order_item_id' => $items[0]->id, 'quantity' => 2],
                    ['order_item_id' => $items[1]->id, 'quantity' => 6],
                ],
            ])
            ->assertSessionHasErrors('quantity');

        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status);
        $this->assertSame(5, $variantA->fresh()->quantity);
        $this->assertSame(15, $variantB->fresh()->quantity);
        $this->assertSame(0, $items[0]->fresh()->returned_quantity);
        $this->assertSame(0, $items[1]->fresh()->returned_quantity);
        $this->assertSame(0, SalesReturn::count());
        $this->assertSame(0, StockMovement::where('movement_type', StockMovement::TYPE_RETURN_IN)->count());
    }

    // ------------------------------------------------------------------
    // Security / RBAC (process-return lives behind role:admin,manager)
    // ------------------------------------------------------------------

    public function test_guest_cannot_process_returns(): void
    {
        $variant = $this->makeVariant(10);
        $order = $this->makeDeliveredOrder([[$variant, 4, 15.00]]);
        $itemId = $order->items()->firstOrFail()->id;

        $this->get(route('admin.orders.process-return', $order))->assertRedirect(route('login'));
        $this->post(route('admin.orders.process-return.store', $order), [
            'items' => [['order_item_id' => $itemId, 'quantity' => 1]],
        ])->assertRedirect(route('login'));

        $this->assertSame(6, $variant->fresh()->quantity);
        $this->assertSame(0, SalesReturn::count());
        $this->assertSame(0, StockMovement::where('movement_type', StockMovement::TYPE_RETURN_IN)->count());
    }

    public function test_staff_cannot_process_returns(): void
    {
        $variant = $this->makeVariant(10);
        $order = $this->makeDeliveredOrder([[$variant, 4, 15.00]]);
        $itemId = $order->items()->firstOrFail()->id;

        $this->actingAs($this->userWithRole('staff'))
            ->get(route('admin.orders.process-return', $order))
            ->assertForbidden();
        $this->actingAs($this->userWithRole('staff'))
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [['order_item_id' => $itemId, 'quantity' => 1]],
            ])
            ->assertForbidden();

        $this->assertSame(6, $variant->fresh()->quantity);
        $this->assertSame(0, SalesReturn::count());
        $this->assertSame(0, StockMovement::where('movement_type', StockMovement::TYPE_RETURN_IN)->count());
    }

    public function test_manager_admin_and_super_admin_can_process_returns(): void
    {
        $variant = $this->makeVariant(10);
        $managerOrder = $this->makeDeliveredOrder([[$variant, 1, 10.00]]);
        $adminOrder = $this->makeDeliveredOrder([[$variant, 1, 10.00]]);
        $superOrder = $this->makeDeliveredOrder([[$variant, 1, 10.00]]);
        $this->assertSame(7, $variant->fresh()->quantity);

        $manager = $this->userWithRole('manager');
        $admin = $this->userWithRole('admin');
        $super = $this->userWithRole('super_admin');

        $this->actingAs($manager)
            ->post(route('admin.orders.process-return.store', $managerOrder), [
                'items' => [['order_item_id' => $managerOrder->items()->firstOrFail()->id, 'quantity' => 1]],
            ])
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $adminOrder), [
                'items' => [['order_item_id' => $adminOrder->items()->firstOrFail()->id, 'quantity' => 1]],
            ])
            ->assertSessionHasNoErrors();
        $this->actingAs($super)
            ->post(route('admin.orders.process-return.store', $superOrder), [
                'items' => [['order_item_id' => $superOrder->items()->firstOrFail()->id, 'quantity' => 1]],
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(3, SalesReturn::count());
        $this->assertSame($manager->id, SalesReturn::where('order_id', $managerOrder->id)->firstOrFail()->returned_by);
        $this->assertSame($admin->id, SalesReturn::where('order_id', $adminOrder->id)->firstOrFail()->returned_by);
        $this->assertSame($super->id, SalesReturn::where('order_id', $superOrder->id)->firstOrFail()->returned_by);
    }

    // ------------------------------------------------------------------
    // UI regression guards
    // ------------------------------------------------------------------

    public function test_return_page_renders_remaining_quantities(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makeDeliveredOrder([[$variant, 5, 20.00]]);

        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [['order_item_id' => $order->items()->firstOrFail()->id, 'quantity' => 2]],
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)
            ->get(route('admin.orders.process-return', $order))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/SalesReturns/Create')
                ->where('order.reference_number', $order->reference_number)
                ->where('order.items.0.quantity', 5)
                ->where('order.items.0.returned_quantity', 2));
    }

    public function test_return_page_redirects_when_order_is_not_delivered(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)
            ->get(route('admin.orders.process-return', $order))
            ->assertRedirect(route('admin.orders.show', $order))
            ->assertInertiaFlash('toast', [
                'type' => 'error',
                'message' => 'Only delivered orders can be returned.',
            ]);
    }

    public function test_orders_show_renders_returned_quantities_and_return_history(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makeDeliveredOrder([[$variant, 5, 20.00]]);

        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [['order_item_id' => $order->items()->firstOrFail()->id, 'quantity' => 2]],
            ])
            ->assertSessionHasNoErrors();

        $salesReturn = SalesReturn::firstOrFail();

        $this->actingAs($admin)
            ->get(route('admin.orders.show', $order))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Orders/Show')
                ->where('order.items.0.returned_quantity', 2)
                ->has('order.returns', 1)
                ->where('order.returns.0.return_number', $salesReturn->return_number)
                ->where('order.returns.0.total', '40.00')
                ->where('order.returns.0.returned_by.name', $admin->name));
    }

    public function test_inventory_history_lists_return_movements(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makeDeliveredOrder([[$variant, 5, 20.00]]);

        $this->actingAs($admin)
            ->post(route('admin.orders.process-return.store', $order), [
                'items' => [['order_item_id' => $order->items()->firstOrFail()->id, 'quantity' => 5]],
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)
            ->get(route('admin.inventory.history', ['movement_type' => StockMovement::TYPE_RETURN_IN]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Inventory/History')
                ->has('movements.data', 1)
                ->where('movements.data.0.movement_type', StockMovement::TYPE_RETURN_IN));
    }
}
