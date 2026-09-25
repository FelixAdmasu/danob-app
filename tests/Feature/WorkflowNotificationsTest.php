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
use App\Models\Supplier;
use App\Models\User;
use App\Services\OrderService;
use App\Services\ReceivingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * Phase 28 — sales and purchasing notifications.
 *
 * Notifications are side effects of the existing workflows: every test also
 * re-asserts the behaviour that must stay exactly as it was (status,
 * stock, receipts), so a green run proves the alerts neither changed nor
 * bypassed the lifecycle they observe.
 */
class WorkflowNotificationsTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    /** @return array{0: User, 1: User, 2: User} admin, manager, staff */
    private function salesAudience(): array
    {
        return [
            $this->userWithRole('admin'),
            $this->userWithRole('manager'),
            $this->userWithRole('staff'),
        ];
    }

    private function makeVariant(int $quantity = 100): ProductVariant
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
     * Pending order built directly (creating it this way is not an order
     * entry event, so these cases start with a clean notification slate).
     *
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float|string}>  $lines
     */
    private function makePendingOrder(array $lines): Order
    {
        $subtotal = 0;
        foreach ($lines as [$variant, $qty, $price]) {
            $subtotal += $qty * (float) $price;
        }

        $order = Order::create([
            'reference_number' => 'ORD-TEST-'.uniqid(),
            'customer_id' => $this->makeCustomer()->id,
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

    private function makeApprovedPO(User $admin, int $quantity = 10): array
    {
        $variant = $this->makeVariant(0);
        $supplier = Supplier::create(['name' => 'Sup-'.uniqid(), 'is_active' => true]);

        $po = PurchaseOrder::create([
            'po_number' => 'PO-TEST-'.uniqid(),
            'supplier_id' => $supplier->id,
            'created_by' => $admin->id,
            'status' => PurchaseOrder::STATUS_APPROVED,
            'ordered_at' => now()->toDateString(),
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_variant_id' => $variant->id,
            'quantity' => $quantity,
            'unit_cost' => 10,
            'subtotal' => 10 * $quantity,
        ]);

        return [$po, $variant];
    }

    /** @return array<int, string|null> */
    private function alertTypesOf(User $user): array
    {
        return $user->notifications()->get()
            ->map(fn ($notification) => $notification->data['type'] ?? null)
            ->values()
            ->all();
    }

    // ------------------------------------------------------------------
    // Sales: created / confirmed / cancelled / delivered / returned
    // ------------------------------------------------------------------

    public function test_order_entry_notifies_sales_roles_about_the_new_pending_order(): void
    {
        [$admin, $manager, $staff] = $this->salesAudience();
        $variant = $this->makeVariant();

        $order = app(OrderService::class)->create([
            'customer_id' => $this->makeCustomer()->id,
            'items' => [[
                'product_variant_id' => $variant->id,
                'quantity' => 2,
                'unit_price' => 10.00,
            ]],
        ]);

        $this->assertSame(Order::STATUS_PENDING, $order->status, 'order entry must still store a pending order');
        $this->assertSame(100, $variant->fresh()->quantity, 'entry must never touch stock');

        foreach ([$admin, $manager, $staff] as $recipient) {
            $row = $recipient->notifications()->firstOrFail();
            $this->assertSame('order_created', $row->data['type']);
            $this->assertSame('info', $row->data['severity']);
            $this->assertSame('Order created', $row->data['title']);
            $this->assertStringContainsString($order->reference_number, $row->data['message']);
            $this->assertSame(route('admin.orders.show', $order), $row->data['url']);
        }
    }

    public function test_confirmation_notifies_sales_roles_and_still_deducts_stock(): void
    {
        [$admin, $manager, $staff] = $this->salesAudience();
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder([[$variant, 15, 10.00]]);

        app(OrderService::class)->confirm($order, $admin->id);

        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status);
        $this->assertSame(85, $variant->fresh()->quantity);

        foreach ([$admin, $manager, $staff] as $recipient) {
            $row = $recipient->notifications()->firstOrFail();
            $this->assertSame('order_confirmed', $row->data['type']);
            $this->assertSame('success', $row->data['severity']);
            $this->assertSame(route('admin.orders.show', $order), $row->data['url']);
        }
    }

    public function test_confirming_twice_notifies_once_and_the_second_attempt_is_rejected(): void
    {
        [$admin] = $this->salesAudience();
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder([[$variant, 10, 5.00]]);

        app(OrderService::class)->confirm($order, $admin->id);

        try {
            app(OrderService::class)->confirm($order->fresh(), $admin->id);
            $this->fail('a confirmed order must not be confirmable again');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('status', $exception->errors());
        }

        $this->assertSame(['order_confirmed'], $this->alertTypesOf($admin));
        $this->assertSame(90, $variant->fresh()->quantity, 'stock must be deducted exactly once');
    }

    public function test_cancelling_a_pending_order_notifies_without_touching_stock(): void
    {
        [$admin, $manager, $staff] = $this->salesAudience();
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder([[$variant, 10, 5.00]]);

        app(OrderService::class)->cancel($order, $admin->id);

        $this->assertSame(Order::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertSame(100, $variant->fresh()->quantity, 'a pending order never held stock');

        foreach ([$admin, $manager, $staff] as $recipient) {
            $row = $recipient->notifications()->firstOrFail();
            $this->assertSame('order_cancelled', $row->data['type']);
            $this->assertSame('warning', $row->data['severity']);
            $this->assertStringNotContainsString('stock was restored', $row->data['message']);
        }
    }

    public function test_cancelling_a_confirmed_order_notifies_and_still_restores_stock(): void
    {
        [$admin] = $this->salesAudience();
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder([[$variant, 10, 5.00]]);

        app(OrderService::class)->confirm($order, $admin->id);
        app(OrderService::class)->cancel($order->fresh(), $admin->id);

        $this->assertSame(Order::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertSame(100, $variant->fresh()->quantity);
        $this->assertEqualsCanonicalizing(
            ['order_confirmed', 'order_cancelled'],
            $this->alertTypesOf($admin),
        );

        $cancelled = $admin->notifications()->get()
            ->first(fn ($notification) => $notification->data['type'] === 'order_cancelled');
        $this->assertStringContainsString('stock was restored', $cancelled->data['message']);
    }

    public function test_delivering_an_order_notifies_sales_roles(): void
    {
        [$admin, $manager, $staff] = $this->salesAudience();
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder([[$variant, 10, 5.00]]);

        app(OrderService::class)->confirm($order, $admin->id);
        app(OrderService::class)->deliver($order->fresh());

        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status);

        foreach ([$admin, $manager, $staff] as $recipient) {
            $row = $recipient->notifications()->get()
                ->first(fn ($notification) => $notification->data['type'] === 'order_delivered');
            $this->assertNotNull($row, 'delivery must notify every sales recipient');
            $this->assertSame('success', $row->data['severity']);
        }
    }

    public function test_processing_a_return_notifies_and_leaves_the_return_workflow_unchanged(): void
    {
        [$admin, $manager, $staff] = $this->salesAudience();
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder([[$variant, 20, 10.00]]);

        app(OrderService::class)->confirm($order, $admin->id);
        app(OrderService::class)->deliver($order->fresh());
        $this->assertSame(80, $variant->fresh()->quantity);

        $response = $this->actingAs($admin)->post(
            route('admin.orders.process-return.store', $order),
            ['items' => [['order_item_id' => $order->items()->firstOrFail()->id, 'quantity' => 20]]],
        );
        $response->assertSessionHasNoErrors();

        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status, 'returns must not change the order status');
        $this->assertSame(100, $variant->fresh()->quantity, 'returned stock must be restored exactly as before');

        foreach ([$admin, $manager, $staff] as $recipient) {
            $row = $recipient->notifications()->get()
                ->first(fn ($notification) => $notification->data['type'] === 'sales_return_processed');
            $this->assertNotNull($row, 'a processed return must notify every sales recipient');
            $this->assertSame('warning', $row->data['severity']);
            $this->assertSame(route('admin.orders.show', $order), $row->data['url']);
        }
    }

    // ------------------------------------------------------------------
    // Purchasing: receiving
    // ------------------------------------------------------------------

    public function test_partial_receiving_notifies_purchasing_roles_only(): void
    {
        $admin = $this->userWithRole('admin');
        $manager = $this->userWithRole('manager');
        $staff = $this->userWithRole('staff');

        [$po, $variant] = $this->makeApprovedPO($admin, 10);

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 4]],
        ])->assertSessionHasNoErrors();

        // Receiving itself is untouched.
        $this->assertSame(PurchaseOrder::STATUS_PARTIALLY_RECEIVED, $po->fresh()->status);
        $this->assertSame(4, $variant->fresh()->quantity);
        $this->assertSame(4, $po->items()->first()->received_quantity);

        foreach ([$admin, $manager] as $recipient) {
            $row = $recipient->notifications()->firstOrFail();
            $this->assertSame('purchase_order_partially_received', $row->data['type']);
            $this->assertSame('warning', $row->data['severity']);
            $this->assertSame(route('admin.purchase-orders.show', $po), $row->data['url']);
        }

        $this->assertSame(
            0,
            $staff->notifications()->count(),
            'staff cannot open purchase orders and must never be notified',
        );
    }

    public function test_completing_receiving_notifies_a_successful_receipt(): void
    {
        $admin = $this->userWithRole('admin');
        $staff = $this->userWithRole('staff');

        [$po, $variant] = $this->makeApprovedPO($admin, 10);

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 10]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrder::STATUS_RECEIVED, $po->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);

        $row = $admin->notifications()->firstOrFail();
        $this->assertSame('purchase_order_received', $row->data['type']);
        $this->assertSame('success', $row->data['severity']);
        $this->assertStringContainsString($po->po_number, $row->data['message']);
        $this->assertSame(0, $staff->notifications()->count());
    }

    public function test_receiving_the_same_po_twice_notifies_per_actual_receipt(): void
    {
        $admin = $this->userWithRole('admin');
        [$po, $variant] = $this->makeApprovedPO($admin, 10);

        $service = app(ReceivingService::class);

        $service->receive($po, [['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 4]]);
        $service->receive($po->fresh(), [['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 6]]);

        $this->assertSame(PurchaseOrder::STATUS_RECEIVED, $po->fresh()->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertEqualsCanonicalizing(
            ['purchase_order_partially_received', 'purchase_order_received'],
            $this->alertTypesOf($admin),
            'each receipt is one event: one partial alert and one completed alert',
        );
    }
}
