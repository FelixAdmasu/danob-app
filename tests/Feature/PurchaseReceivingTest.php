<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseReceipt;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PurchaseReceivingTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function staff(): User
    {
        return User::factory()->create(['role' => 'staff']);
    }

    private function makeVariant(): Product
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
        $product->variants()->create(['name' => 'Default', 'quantity' => 0, 'is_active' => true]);

        return $product;
    }

    private function makeApprovedPO(User $admin, int $quantity = 10): array
    {
        $product = $this->makeVariant();
        $variant = $product->variants()->first();
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

    private function makePOWithStatus(User $admin, string $status, int $quantity = 10): array
    {
        $product = $this->makeVariant();
        $variant = $product->variants()->first();
        $supplier = Supplier::create(['name' => 'Sup-'.uniqid(), 'is_active' => true]);

        $po = PurchaseOrder::create([
            'po_number' => 'PO-TEST-'.uniqid(),
            'supplier_id' => $supplier->id,
            'created_by' => $admin->id,
            'status' => $status,
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

    public function test_guest_cannot_receive(): void
    {
        [$po, $variant] = $this->makeApprovedPO($this->admin());

        $this->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 1]],
        ])->assertRedirect(route('login'));

        $this->get(route('admin.purchase-orders.receive', $po))->assertRedirect(route('login'));
    }

    public function test_staff_cannot_receive(): void
    {
        [$po] = $this->makeApprovedPO($this->admin());

        $this->actingAs($this->staff())->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 1]],
        ])->assertForbidden();
    }

    public function test_receiving_requires_items(): void
    {
        $admin = $this->admin();
        [$po] = $this->makeApprovedPO($admin);

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [])
            ->assertSessionHasErrors('items');
    }

    public function test_draft_po_cannot_be_received(): void
    {
        $admin = $this->admin();
        [$po, $variant] = $this->makePOWithStatus($admin, PurchaseOrder::STATUS_DRAFT);

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('purchase_order');

        $this->assertSame(0, $variant->fresh()->quantity);
        $this->assertSame(0, DB::table('purchase_receipts')->count());
    }

    public function test_cancelled_po_cannot_be_received(): void
    {
        $admin = $this->admin();
        [$po, $variant] = $this->makePOWithStatus($admin, PurchaseOrder::STATUS_CANCELLED);

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('purchase_order');

        $this->assertSame(0, $variant->fresh()->quantity);
        $this->assertSame(0, DB::table('purchase_receipts')->count());
    }

    public function test_partial_receive_increments_stock_and_marks_po_partially_received(): void
    {
        $admin = $this->admin();
        [$po, $variant] = $this->makeApprovedPO($admin, 10);
        $orderItem = $po->items()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 4]],
            'notes' => 'First delivery',
        ])->assertRedirect(route('admin.purchase-orders.show', $po));

        $po->refresh();
        $variant->refresh();

        $this->assertSame(PurchaseOrder::STATUS_PARTIALLY_RECEIVED, $po->status);
        $this->assertSame(4, $variant->quantity);
        $this->assertSame(4, $orderItem->fresh()->received_quantity);
        $this->assertSame(6, $orderItem->fresh()->remaining);
        $this->assertTrue($po->canBeReceived());

        $this->assertDatabaseHas('purchase_receipts', [
            'purchase_order_id' => $po->id,
            'received_by' => $admin->id,
            'notes' => 'First delivery',
        ]);
        $this->assertDatabaseHas('purchase_receipt_items', [
            'purchase_order_item_id' => $orderItem->id,
            'product_variant_id' => $variant->id,
            'quantity' => 4,
        ]);

        $movement = StockMovement::where('product_variant_id', $variant->id)->latest('id')->first();
        $this->assertNotNull($movement);
        $this->assertSame(StockMovement::TYPE_PURCHASE, $movement->movement_type);
        $this->assertSame(4, $movement->quantity);
        $this->assertSame(0, $movement->quantity_before);
        $this->assertSame(4, $movement->quantity_after);
        $this->assertSame($admin->id, $movement->user_id);
        $this->assertSame(PurchaseReceipt::class, $movement->reference_type);

        $receipt = PurchaseReceipt::where('purchase_order_id', $po->id)->first();
        $this->assertSame($receipt->id, $movement->reference_id);
        $this->assertStringStartsWith('GRN-'.date('Y').'-', $receipt->receipt_number);
    }

    public function test_over_receiving_is_rejected_and_rolls_back(): void
    {
        $admin = $this->admin();
        [$po, $variant] = $this->makeApprovedPO($admin, 10);
        $orderItem = $po->items()->first();

        $receiptsBefore = DB::table('purchase_receipts')->count();
        $movementsBefore = DB::table('stock_movements')->count();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 11]],
        ])->assertSessionHasErrors('quantity');

        $this->assertSame(0, $variant->fresh()->quantity);
        $this->assertSame(PurchaseOrder::STATUS_APPROVED, $po->fresh()->status);
        $this->assertSame(0, $orderItem->fresh()->received_quantity);
        $this->assertSame($receiptsBefore, DB::table('purchase_receipts')->count());
        $this->assertSame($movementsBefore, DB::table('stock_movements')->count());
    }

    public function test_full_receive_marks_po_received(): void
    {
        $admin = $this->admin();
        [$po, $variant] = $this->makeApprovedPO($admin, 10);
        $orderItem = $po->items()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 10]],
        ])->assertRedirect(route('admin.purchase-orders.show', $po));

        $po->refresh();

        $this->assertSame(PurchaseOrder::STATUS_RECEIVED, $po->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(10, $orderItem->fresh()->received_quantity);
        $this->assertFalse($po->canBeReceived());
        $this->assertFalse($po->canBeCancelled());
    }

    public function test_second_receive_against_partially_received_po(): void
    {
        $admin = $this->admin();
        [$po, $variant] = $this->makeApprovedPO($admin, 10);
        $orderItem = $po->items()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 6]],
        ])->assertRedirect(route('admin.purchase-orders.show', $po));

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 4]],
        ])->assertRedirect(route('admin.purchase-orders.show', $po));

        $po->refresh();

        $this->assertSame(PurchaseOrder::STATUS_RECEIVED, $po->status);
        $this->assertSame(10, $variant->fresh()->quantity);
        $this->assertSame(10, $orderItem->fresh()->received_quantity);
        $this->assertSame(2, DB::table('purchase_receipts')->where('purchase_order_id', $po->id)->count());
        $this->assertSame(2, DB::table('stock_movements')
            ->where('product_variant_id', $variant->id)
            ->where('movement_type', StockMovement::TYPE_PURCHASE)->count());
    }

    public function test_duplicate_receive_beyond_remaining_is_rejected(): void
    {
        $admin = $this->admin();
        [$po, $variant] = $this->makeApprovedPO($admin, 10);
        $orderItem = $po->items()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 8]],
        ])->assertRedirect(route('admin.purchase-orders.show', $po));

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 3]],
        ])->assertSessionHasErrors('quantity');

        $this->assertSame(8, $variant->fresh()->quantity);
        $this->assertSame(8, $orderItem->fresh()->received_quantity);
        $this->assertSame(PurchaseOrder::STATUS_PARTIALLY_RECEIVED, $po->fresh()->status);
        $this->assertSame(1, DB::table('purchase_receipts')->where('purchase_order_id', $po->id)->count());
    }
}
