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

class PurchaseCostTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
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

    private function makeSupplier(): Supplier
    {
        return Supplier::create(['name' => 'Sup-'.uniqid(), 'is_active' => true]);
    }

    private function storePayload(Supplier $supplier, array $items, array $extra = []): array
    {
        return array_merge([
            'supplier_id' => $supplier->id,
            'items' => $items,
        ], $extra);
    }

    /**
     * Build an approved PO directly (only UserFactory exists in this project).
     *
     * @return array{0: PurchaseOrder, 1: Product}
     */
    private function approvedPo(User $admin, int $quantity, string $unitCost): array
    {
        $product = $this->makeVariant();
        $variant = $product->variants()->first();
        $supplier = $this->makeSupplier();

        $lineTotal = number_format($quantity * (float) $unitCost, 2, '.', '');

        $po = PurchaseOrder::create([
            'po_number' => 'PO-TEST-'.uniqid(),
            'supplier_id' => $supplier->id,
            'created_by' => $admin->id,
            'status' => PurchaseOrder::STATUS_APPROVED,
            'ordered_at' => now()->toDateString(),
            'subtotal' => $lineTotal,
            'total' => $lineTotal,
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_variant_id' => $variant->id,
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'subtotal' => $lineTotal,
        ]);

        return [$po, $product];
    }

    // ------------------------------------------------------------------
    // Purchase cost creation
    // ------------------------------------------------------------------

    public function test_store_computes_line_subtotals_and_order_total_server_side(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variantA = $this->makeVariant()->variants()->first();
        $variantB = $this->makeVariant()->variants()->first();

        // Client-sent totals must be ignored entirely.
        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variantA->id, 'quantity' => 10, 'unit_cost' => 250],
            ['product_variant_id' => $variantB->id, 'quantity' => 4, 'unit_cost' => 12.5],
        ], ['subtotal' => '1.00', 'total' => '999999.00']))
            ->assertSessionHasNoErrors();

        $po = PurchaseOrder::latest('id')->firstOrFail();

        $this->assertSame('2500.00', $po->items()->orderBy('id')->first()->subtotal);
        $this->assertSame('250.00', $po->items()->orderBy('id')->first()->unit_cost);
        $this->assertSame('50.00', $po->items()->orderBy('id')->get()->last()->subtotal);
        $this->assertSame('12.50', $po->items()->orderBy('id')->get()->last()->unit_cost);
        $this->assertSame('2550.00', $po->subtotal);
        $this->assertSame('2550.00', $po->total);
    }

    public function test_store_applies_discount_and_tax_server_side(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 10, 'unit_cost' => 250],
        ], ['discount' => 100, 'tax' => 50]))
            ->assertSessionHasNoErrors();

        $po = PurchaseOrder::latest('id')->firstOrFail();

        $this->assertSame('2500.00', $po->subtotal);
        $this->assertSame('100.00', $po->discount);
        $this->assertSame('50.00', $po->tax);
        $this->assertSame('2450.00', $po->total);
    }

    public function test_store_rejects_negative_unit_cost(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_cost' => -5],
        ]))->assertSessionHasErrors('items.0.unit_cost');

        $this->assertSame(0, DB::table('purchase_orders')->count());
    }

    public function test_store_rejects_missing_unit_cost(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 1],
        ]))->assertSessionHasErrors('items.0.unit_cost');
    }

    public function test_store_rejects_non_numeric_unit_cost(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_cost' => 'abc'],
        ]))->assertSessionHasErrors('items.0.unit_cost');
    }

    public function test_store_allows_zero_unit_cost(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 3, 'unit_cost' => 0],
        ]))->assertSessionHasNoErrors();

        $po = PurchaseOrder::latest('id')->firstOrFail();
        $item = $po->items()->firstOrFail();

        $this->assertSame('0.00', $item->unit_cost);
        $this->assertSame('0.00', $item->subtotal);
        $this->assertSame('0.00', $po->subtotal);
        $this->assertSame('0.00', $po->total);
    }

    public function test_line_subtotals_are_deterministic_at_two_decimals(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variantA = $this->makeVariant()->variants()->first();
        $variantB = $this->makeVariant()->variants()->first();

        // Classic binary floating-point traps: 3 x 33.33 and 7 x 0.15.
        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variantA->id, 'quantity' => 3, 'unit_cost' => 33.33],
            ['product_variant_id' => $variantB->id, 'quantity' => 7, 'unit_cost' => 0.15],
        ]))->assertSessionHasNoErrors();

        $po = PurchaseOrder::latest('id')->firstOrFail();

        $this->assertSame('99.99', $po->items()->orderBy('id')->first()->subtotal);
        $this->assertSame('1.05', $po->items()->orderBy('id')->get()->last()->subtotal);
        $this->assertSame('101.04', $po->subtotal);
        $this->assertSame('101.04', $po->total);
    }

    // ------------------------------------------------------------------
    // Draft updates
    // ------------------------------------------------------------------

    public function test_update_recalculates_totals_and_ignores_client_total(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 10, 'unit_cost' => 100],
        ]))->assertSessionHasNoErrors();

        $po = PurchaseOrder::latest('id')->firstOrFail();
        $this->assertSame(PurchaseOrder::STATUS_DRAFT, $po->status);

        $this->actingAs($admin)->put(route('admin.purchase-orders.update', $po), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 5, 'unit_cost' => 80.5],
        ], ['total' => '1.00', 'discount' => 10]))
            ->assertRedirect(route('admin.purchase-orders.show', $po));

        $po->refresh();
        $item = $po->items()->firstOrFail();

        $this->assertSame('80.50', $item->unit_cost);
        $this->assertSame('402.50', $item->subtotal);
        $this->assertSame('402.50', $po->subtotal);
        $this->assertSame('10.00', $po->discount);
        $this->assertSame('392.50', $po->total);
    }

    public function test_update_is_rejected_for_non_draft_orders(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 10, 'unit_cost' => 100],
        ]))->assertSessionHasNoErrors();

        $po = PurchaseOrder::latest('id')->firstOrFail();
        $this->actingAs($admin)->post(route('admin.purchase-orders.submit', $po))->assertSessionHasNoErrors();

        $this->actingAs($admin)->put(route('admin.purchase-orders.update', $po), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_cost' => 1],
        ]))->assertSessionHasErrors('status');

        $po->refresh();
        $this->assertSame('1000.00', $po->total);
        $this->assertSame('100.00', $po->items()->firstOrFail()->unit_cost);
    }

    // ------------------------------------------------------------------
    // Security / RBAC
    // ------------------------------------------------------------------

    public function test_guest_cannot_create_purchase_order(): void
    {
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_cost' => 10],
        ]))->assertRedirect(route('login'));

        $this->assertSame(0, DB::table('purchase_orders')->count());
    }

    public function test_staff_cannot_create_or_update_purchase_order(): void
    {
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($this->userWithRole('staff'))->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_cost' => 10],
        ]))->assertForbidden();

        $po = PurchaseOrder::create([
            'po_number' => 'PO-TEST-'.uniqid(),
            'supplier_id' => $supplier->id,
            'created_by' => $this->userWithRole('admin')->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'ordered_at' => now()->toDateString(),
        ]);

        $this->actingAs($this->userWithRole('staff'))->put(route('admin.purchase-orders.update', $po), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_cost' => 10],
        ]))->assertForbidden();
    }

    public function test_manager_can_create_purchase_order(): void
    {
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($this->userWithRole('manager'))->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 2, 'unit_cost' => 25],
        ]))->assertSessionHasNoErrors();

        $this->assertSame(1, DB::table('purchase_orders')->count());
        $this->assertSame('50.00', PurchaseOrder::firstOrFail()->total);
    }

    public function test_super_admin_can_create_purchase_order(): void
    {
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($this->userWithRole('super_admin'))->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 2, 'unit_cost' => 25],
        ]))->assertSessionHasNoErrors();

        $this->assertSame(1, DB::table('purchase_orders')->count());
    }

    // ------------------------------------------------------------------
    // Receiving cost behaviour
    // ------------------------------------------------------------------

    public function test_receiving_preserves_po_line_unit_cost_on_receipt(): void
    {
        $admin = $this->userWithRole('admin');
        [$po, $product] = $this->approvedPo($admin, 100, '50.00');
        $variant = $product->variants()->first();
        $orderItem = $po->items()->firstOrFail();

        // A client-supplied unit cost must never be trusted.
        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [[
                'purchase_order_item_id' => $orderItem->id,
                'quantity' => 40,
                'unit_cost' => 1,
            ]],
        ])->assertRedirect(route('admin.purchase-orders.show', $po));

        $receipt = PurchaseReceipt::where('purchase_order_id', $po->id)->firstOrFail();
        $receiptItem = $receipt->items()->firstOrFail();

        $this->assertSame(40, $receiptItem->quantity);
        $this->assertSame('50.00', $receiptItem->unit_cost);
        $this->assertSame($orderItem->id, $receiptItem->purchase_order_item_id);
        $this->assertSame($variant->id, $receiptItem->product_variant_id);

        $orderItem->refresh();
        $this->assertSame(40, $orderItem->received_quantity);
        $this->assertSame(60, $orderItem->remaining);
        $this->assertSame('50.00', $orderItem->unit_cost);
        $this->assertSame('5000.00', $orderItem->subtotal);

        $this->assertSame(40, $variant->fresh()->quantity);
        $this->assertSame(1, StockMovement::where('product_variant_id', $variant->id)->count());

        $movement = StockMovement::where('product_variant_id', $variant->id)->firstOrFail();
        $this->assertSame(StockMovement::TYPE_PURCHASE, $movement->movement_type);
        $this->assertSame(40, $movement->quantity);
        $this->assertSame(0, $movement->quantity_before);
        $this->assertSame(40, $movement->quantity_after);
        $this->assertSame(PurchaseReceipt::class, $movement->reference_type);
        $this->assertSame($receipt->id, $movement->reference_id);
    }

    public function test_partial_receiving_keeps_cost_traceable_across_receipts(): void
    {
        $admin = $this->userWithRole('admin');
        [$po] = $this->approvedPo($admin, 100, '50.00');
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 30]],
        ])->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 20]],
        ])->assertSessionHasNoErrors();

        $po->refresh();
        $orderItem->refresh();

        $this->assertSame(PurchaseOrder::STATUS_PARTIALLY_RECEIVED, $po->status);
        $this->assertSame(50, $orderItem->received_quantity);
        $this->assertSame(50, $orderItem->remaining);

        $receiptItems = DB::table('purchase_receipt_items')
            ->where('purchase_order_item_id', $orderItem->id)
            ->orderBy('id')
            ->get();

        $this->assertSame([30, 20], $receiptItems->pluck('quantity')->all());
        $this->assertSame(['50.00', '50.00'], array_map(
            fn ($row) => number_format((float) $row->unit_cost, 2, '.', ''),
            $receiptItems->all(),
        ));

        // Cost on the original PO line is never modified by receiving.
        $this->assertSame('50.00', $orderItem->unit_cost);
        $this->assertSame('5000.00', $orderItem->subtotal);
        $this->assertSame(50, $po->items()->firstOrFail()->received_quantity);
    }

    public function test_full_receiving_completes_with_zero_remaining_and_costs_intact(): void
    {
        $admin = $this->userWithRole('admin');
        [$po, $product] = $this->approvedPo($admin, 100, '50.00');
        $variant = $product->variants()->first();
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 100]],
        ])->assertSessionHasNoErrors();

        $po->refresh();
        $orderItem->refresh();

        $this->assertSame(PurchaseOrder::STATUS_RECEIVED, $po->status);
        $this->assertSame(100, $orderItem->received_quantity);
        $this->assertSame(0, $orderItem->remaining);
        $this->assertFalse($po->canBeReceived());
        $this->assertSame(100, $variant->fresh()->quantity);

        $receipt = PurchaseReceipt::where('purchase_order_id', $po->id)->firstOrFail();
        $this->assertSame('50.00', number_format((float) $receipt->items()->firstOrFail()->unit_cost, 2, '.', ''));
    }

    public function test_full_cost_chain_supplier_to_stock_movement_is_traceable(): void
    {
        $admin = $this->userWithRole('admin');
        [$po, $product] = $this->approvedPo($admin, 60, '25.50');
        $variant = $product->variants()->first();
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 15]],
        ])->assertSessionHasNoErrors();

        $receipt = PurchaseReceipt::where('purchase_order_id', $po->id)->firstOrFail();
        $receiptItem = $receipt->items()->firstOrFail();
        $movement = StockMovement::where('product_variant_id', $variant->id)->firstOrFail();

        // Supplier -> PO -> PO line -> Receipt -> Receipt line -> Variant -> Movement.
        $this->assertNotNull($po->supplier);
        $this->assertSame($po->id, $receipt->purchase_order_id);
        $this->assertSame($orderItem->id, $receiptItem->purchase_order_item_id);
        $this->assertSame($variant->id, $receiptItem->product_variant_id);
        $this->assertSame($variant->id, $movement->product_variant_id);
        $this->assertSame(PurchaseReceipt::class, $movement->reference_type);
        $this->assertSame($receipt->id, $movement->reference_id);
        $this->assertSame('25.50', $receiptItem->unit_cost);
        $this->assertSame('25.50', $orderItem->fresh()->unit_cost);
    }

    // ------------------------------------------------------------------
    // Phase-15 regression (with cost focus)
    // ------------------------------------------------------------------

    public function test_over_receiving_is_still_rejected_and_rolls_back(): void
    {
        $admin = $this->userWithRole('admin');
        [$po, $product] = $this->approvedPo($admin, 10, '50.00');
        $variant = $product->variants()->first();
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 11]],
        ])->assertSessionHasErrors('quantity');

        $this->assertSame(0, $variant->fresh()->quantity);
        $this->assertSame(0, $orderItem->fresh()->received_quantity);
        $this->assertSame('50.00', $orderItem->fresh()->unit_cost);
        $this->assertSame(0, DB::table('purchase_receipts')->count());
        $this->assertSame(0, DB::table('purchase_receipt_items')->count());
        $this->assertSame(0, DB::table('stock_movements')->count());
    }

    public function test_cancelled_po_cannot_be_received(): void
    {
        $admin = $this->userWithRole('admin');
        [$po, $product] = $this->approvedPo($admin, 10, '50.00');
        $po->update(['status' => PurchaseOrder::STATUS_CANCELLED]);
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('purchase_order');

        $this->assertSame(0, DB::table('purchase_receipts')->count());
        $this->assertSame('50.00', $orderItem->fresh()->unit_cost);
    }

    public function test_draft_po_cannot_be_received(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $variant = $this->makeVariant()->variants()->first();

        $this->actingAs($admin)->post(route('admin.purchase-orders.store'), $this->storePayload($supplier, [
            ['product_variant_id' => $variant->id, 'quantity' => 10, 'unit_cost' => 100],
        ]))->assertSessionHasNoErrors();

        $po = PurchaseOrder::latest('id')->firstOrFail();
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('purchase_order');

        $this->assertSame(0, $variant->fresh()->quantity);
        $this->assertSame(0, DB::table('purchase_receipts')->count());
    }

    public function test_guest_cannot_receive_and_staff_is_forbidden_from_cost_endpoints(): void
    {
        $admin = $this->userWithRole('admin');
        [$po] = $this->approvedPo($admin, 10, '50.00');
        $orderItem = $po->items()->firstOrFail();

        $this->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 1]],
        ])->assertRedirect(route('login'));

        $this->actingAs($this->userWithRole('staff'))->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 1]],
        ])->assertForbidden();

        $this->assertSame(0, DB::table('purchase_receipts')->count());
    }
}
