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
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderCancellationTest extends TestCase
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

    // ------------------------------------------------------------------
    // Pending cancellation: status only, inventory untouched
    // ------------------------------------------------------------------

    public function test_pending_cancellation_changes_status_without_touching_inventory(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasNoErrors()
            ->assertInertiaFlash('toast', [
                'type' => 'success',
                'message' => 'Order cancelled.',
            ]);

        $order->refresh();
        $this->assertSame(Order::STATUS_CANCELLED, $order->status);
        $this->assertFalse($order->canBeCancelled());
        $this->assertSame(10, $variant->fresh()->quantity);
        // No reversal movement — nothing was ever deducted.
        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    // ------------------------------------------------------------------
    // Confirmed cancellation: exact restoration + auditable ledger
    // (ledger example: 100 -> sale -20 -> 80 -> cancellation +20 -> 100)
    // ------------------------------------------------------------------

    public function test_confirmed_cancellation_restores_stock_and_creates_reversal_movement(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder([[$variant, 20, 10.00]]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();
        $this->assertSame(80, $variant->fresh()->quantity);

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasNoErrors()
            ->assertInertiaFlash('toast', [
                'type' => 'success',
                'message' => 'Order cancelled and inventory restored.',
            ]);

        $order->refresh();
        $this->assertSame(Order::STATUS_CANCELLED, $order->status);
        $this->assertSame(100, $variant->fresh()->quantity);

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
        $this->assertSame(Order::class, $sale->reference_type);
        $this->assertSame($order->id, $sale->reference_id);

        // A NEW compensating movement records the reversal.
        $reversal = $movements[1];
        $this->assertSame(StockMovement::TYPE_CANCELLATION_IN, $reversal->movement_type);
        $this->assertSame(20, $reversal->quantity);
        $this->assertSame(80, $reversal->quantity_before);
        $this->assertSame(100, $reversal->quantity_after);
        $this->assertSame(Order::class, $reversal->reference_type);
        $this->assertSame($order->id, $reversal->reference_id);
        $this->assertSame($admin->id, $reversal->user_id);
        $this->assertSame('Order '.$order->reference_number.' cancellation reversal', $reversal->reason);
    }

    public function test_cancelling_confirmed_order_restores_every_line(): void
    {
        $admin = $this->userWithRole('admin');
        $variantA = $this->makeVariant(10);
        $variantB = $this->makeVariant(20);
        $order = $this->makePendingOrder([
            [$variantA, 3, 25.00],
            [$variantB, 5, 10.00],
        ]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();
        $this->assertSame(7, $variantA->fresh()->quantity);
        $this->assertSame(15, $variantB->fresh()->quantity);

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasNoErrors();

        $this->assertSame(Order::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertSame(10, $variantA->fresh()->quantity);
        $this->assertSame(20, $variantB->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('product_variant_id', $variantA->id)
            ->where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
        $this->assertSame(1, StockMovement::where('product_variant_id', $variantB->id)
            ->where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
    }

    // ------------------------------------------------------------------
    // Atomicity: a failure mid-reversal must roll back EVERYTHING
    // ------------------------------------------------------------------

    public function test_reversal_failure_rolls_back_status_stock_and_movements(): void
    {
        $admin = $this->userWithRole('admin');
        $variantA = $this->makeVariant(10);
        $variantB = $this->makeVariant(20);
        $order = $this->makePendingOrder([
            [$variantA, 3, 25.00],
            [$variantB, 5, 10.00],
        ]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();
        $this->assertSame(7, $variantA->fresh()->quantity);
        $this->assertSame(15, $variantB->fresh()->quantity);

        // Corrupt the second line so the reversal fails mid-way through the
        // transaction (InventoryService rejects non-positive quantities).
        $secondItem = $order->items()->orderByDesc('id')->firstOrFail();
        DB::table('order_items')->where('id', $secondItem->id)->update(['quantity' => 0]);

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasErrors('quantity');

        // No partial restoration, no partial movements, order stays confirmed.
        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status);
        $this->assertSame(7, $variantA->fresh()->quantity);
        $this->assertSame(15, $variantB->fresh()->quantity);
        $this->assertSame(2, DB::table('stock_movements')->count());
        $this->assertSame(0, StockMovement::where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
    }

    // ------------------------------------------------------------------
    // Idempotency: cancelled is final, stock restored exactly once
    // ------------------------------------------------------------------

    public function test_double_cancellation_restores_stock_exactly_once(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasNoErrors();
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());

        // Second cancellation is rejected before touching inventory.
        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasErrors('status');

        $this->assertSame(Order::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
        $this->assertSame(2, DB::table('stock_movements')->count());
    }

    public function test_cancelled_orders_cannot_be_confirmed_or_delivered(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasErrors('status');
        $this->actingAs($admin)->post(route('admin.orders.deliver', $order))
            ->assertSessionHasErrors('status');

        $this->assertSame(Order::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    // ------------------------------------------------------------------
    // Delivered orders: returns workflow, cancellation stays blocked
    // ------------------------------------------------------------------

    public function test_delivered_order_cancellation_remains_blocked(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);

        $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->post(route('admin.orders.deliver', $order))
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('admin.orders.cancel', $order))
            ->assertSessionHasErrors('status');

        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status);
        $this->assertSame(6, $variant->fresh()->quantity);
        $this->assertSame(0, StockMovement::where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
        $this->assertSame(1, StockMovement::where('movement_type', StockMovement::TYPE_SALE)->count());
    }

    // ------------------------------------------------------------------
    // Security / RBAC (cancel lives behind role:admin,manager)
    // ------------------------------------------------------------------

    public function test_guest_cannot_cancel_a_confirmed_order(): void
    {
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);
        // Confirm via the service so no authenticated guard state leaks into
        // the guest request below.
        app(OrderService::class)->confirm($order, $this->userWithRole('admin')->id);

        $this->post(route('admin.orders.cancel', $order))->assertRedirect(route('login'));

        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status);
        $this->assertSame(6, $variant->fresh()->quantity);
        $this->assertSame(0, StockMovement::where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
    }

    public function test_staff_cannot_cancel_a_confirmed_order(): void
    {
        $variant = $this->makeVariant(10);
        $order = $this->makePendingOrder([[$variant, 4, 15.00]]);
        $admin = $this->userWithRole('admin');
        $this->actingAs($admin)->post(route('admin.orders.confirm', $order));

        $this->actingAs($this->userWithRole('staff'))
            ->post(route('admin.orders.cancel', $order))
            ->assertForbidden();

        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status);
        $this->assertSame(6, $variant->fresh()->quantity);
        $this->assertSame(0, StockMovement::where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
    }

    public function test_manager_admin_and_super_admin_can_cancel_confirmed_orders(): void
    {
        $variant = $this->makeVariant(10);
        $managerOrder = $this->makePendingOrder([[$variant, 1, 10.00]]);
        $adminOrder = $this->makePendingOrder([[$variant, 1, 10.00]]);
        $superOrder = $this->makePendingOrder([[$variant, 1, 10.00]]);

        $admin = $this->userWithRole('admin');
        foreach ([$managerOrder, $adminOrder, $superOrder] as $order) {
            $this->actingAs($admin)->post(route('admin.orders.confirm', $order))
                ->assertSessionHasNoErrors();
        }
        $this->assertSame(7, $variant->fresh()->quantity);

        $this->actingAs($this->userWithRole('manager'))
            ->post(route('admin.orders.cancel', $managerOrder))
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)
            ->post(route('admin.orders.cancel', $adminOrder))
            ->assertSessionHasNoErrors();
        $this->actingAs($this->userWithRole('super_admin'))
            ->post(route('admin.orders.cancel', $superOrder))
            ->assertSessionHasNoErrors();

        $this->assertSame(Order::STATUS_CANCELLED, $managerOrder->fresh()->status);
        $this->assertSame(Order::STATUS_CANCELLED, $adminOrder->fresh()->status);
        $this->assertSame(Order::STATUS_CANCELLED, $superOrder->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(3, StockMovement::where('movement_type', StockMovement::TYPE_CANCELLATION_IN)->count());
    }

    // ------------------------------------------------------------------
    // Capability helpers mirror the server-side business rule (Step 9)
    // ------------------------------------------------------------------

    public function test_capability_helpers_reflect_cancellation_rules(): void
    {
        $variant = $this->makeVariant(10);
        $pending = $this->makePendingOrder([[$variant, 1, 5.00]]);
        $confirmed = $this->makePendingOrder([[$variant, 1, 5.00]]);
        $delivered = $this->makePendingOrder([[$variant, 1, 5.00]]);
        $cancelled = $this->makePendingOrder([[$variant, 1, 5.00]]);

        $this->assertTrue($pending->canBeConfirmed());
        $this->assertTrue($pending->canBeCancelled());
        $this->assertFalse($pending->canBeDelivered());

        $admin = $this->userWithRole('admin');
        $this->actingAs($admin)->post(route('admin.orders.confirm', $confirmed));
        $this->assertFalse($confirmed->fresh()->canBeConfirmed());
        $this->assertTrue($confirmed->fresh()->canBeCancelled());
        $this->assertTrue($confirmed->fresh()->canBeDelivered());

        $this->actingAs($admin)->post(route('admin.orders.confirm', $delivered));
        $this->actingAs($admin)->post(route('admin.orders.deliver', $delivered));
        $this->assertFalse($delivered->fresh()->canBeConfirmed());
        $this->assertFalse($delivered->fresh()->canBeCancelled());
        $this->assertFalse($delivered->fresh()->canBeDelivered());

        $this->actingAs($admin)->post(route('admin.orders.cancel', $cancelled));
        $this->assertFalse($cancelled->fresh()->canBeConfirmed());
        $this->assertFalse($cancelled->fresh()->canBeCancelled());
        $this->assertFalse($cancelled->fresh()->canBeDelivered());
    }
}
