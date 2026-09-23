<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PurchaseDashboardTest extends TestCase
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

    private function makeSupplier(bool $active = true): Supplier
    {
        return Supplier::create(['name' => 'Sup-'.uniqid(), 'is_active' => $active]);
    }

    /**
     * Build a purchase order with direct fixture rows (only UserFactory exists
     * in this project). Lines are positional tuples [quantity, unit_cost,
     * received_quantity?]. Totals use the integer-cents rule from
     * PurchaseOrderService.
     *
     * @param  array<int, array{0: int, 1: string, 2?: int}>  $lines
     * @param  array<string, mixed>  $overrides
     */
    private function makePo(User $admin, string $status, array $lines, ?Supplier $supplier = null, array $overrides = []): PurchaseOrder
    {
        $supplier ??= $this->makeSupplier();

        $subtotalCents = 0;
        foreach ($lines as $line) {
            $subtotalCents += (int) round(((float) $line[1]) * 100) * $line[0];
        }
        $total = number_format($subtotalCents / 100, 2, '.', '');

        $po = PurchaseOrder::create(array_merge([
            'po_number' => 'PO-TEST-'.uniqid(),
            'supplier_id' => $supplier->id,
            'created_by' => $admin->id,
            'status' => $status,
            'ordered_at' => now()->toDateString(),
            'subtotal' => $total,
            'total' => $total,
        ], $overrides));

        foreach ($lines as $line) {
            $variant = $this->makeVariant()->variants()->first();

            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'product_variant_id' => $variant->id,
                'quantity' => $line[0],
                'unit_cost' => $line[1],
                'subtotal' => number_format(((float) $line[1]) * $line[0], 2, '.', ''),
                'received_quantity' => $line[2] ?? 0,
            ]);
        }

        return $po;
    }

    private function dashboard(User $user)
    {
        return $this->actingAs($user)->get(route('admin.purchases.dashboard'));
    }

    // ------------------------------------------------------------------
    // Summary metrics
    // ------------------------------------------------------------------

    public function test_summary_metrics_count_each_purchase_order_status(): void
    {
        $admin = $this->userWithRole('admin');
        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[10, '10.00']]);
        $this->makePo($admin, PurchaseOrder::STATUS_SUBMITTED, [[10, '10.00']]);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00']]);
        $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[10, '10.00']]);
        $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[10, '10.00']]);
        $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[10, '10.00']]);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/PurchaseDashboard')
            ->where('purchases.metrics.total_pos', 6)
            ->where('purchases.metrics.open', 4)
            ->where('purchases.metrics.partially_received', 1)
            ->where('purchases.metrics.received', 1)
            ->where('purchases.metrics.cancelled', 1));
    }

    public function test_purchase_value_sums_non_cancelled_authoritative_totals(): void
    {
        $admin = $this->userWithRole('admin');
        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[4, '25.00']]);        // 100.00
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']]);    // 250.00
        $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[1, '500.00']]);   // 500.00, excluded

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('purchases.metrics.purchase_value', '350.00'));

        // The metric must equal the database sum of persisted PO totals.
        $this->assertSame(350.0, (float) DB::table('purchase_orders')
            ->where('status', '!=', PurchaseOrder::STATUS_CANCELLED)
            ->sum('total'));
        $this->assertSame(100.0, (float) PurchaseOrder::orderBy('id')->first()->total);
        $this->assertSame(250.0, (float) PurchaseOrder::orderBy('id')->skip(1)->first()->total);
    }

    public function test_active_suppliers_with_purchases_counts_only_active_suppliers_with_orders(): void
    {
        $admin = $this->userWithRole('admin');
        $activeWithPo = $this->makeSupplier(true);
        $inactiveWithPo = $this->makeSupplier(false);
        $this->makeSupplier(true); // active, but no purchase orders

        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $activeWithPo);
        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $inactiveWithPo);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('purchases.metrics.suppliers_with_purchases', 1));
    }

    // ------------------------------------------------------------------
    // Outstanding purchases
    // ------------------------------------------------------------------

    public function test_outstanding_lists_orders_still_requiring_action(): void
    {
        $admin = $this->userWithRole('admin');
        $draft = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[10, '10.00']]);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00']]);
        $partial = $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[10, '10.00', 4]]);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.outstanding', 3)
            ->where('purchases.outstanding.0.po_number', $draft->po_number)
            ->where('purchases.outstanding.2.ordered_quantity', 10)
            ->where('purchases.outstanding.2.received_quantity', 4)
            ->where('purchases.outstanding.2.remaining_quantity', 6));
    }

    public function test_outstanding_remaining_quantity_is_clamped_at_zero(): void
    {
        $admin = $this->userWithRole('admin');
        // Bad historical data: received above ordered must never show negative.
        $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[10, '10.00', 12]]);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.outstanding', 1)
            ->where('purchases.outstanding.0.ordered_quantity', 10)
            ->where('purchases.outstanding.0.received_quantity', 12)
            ->where('purchases.outstanding.0.remaining_quantity', 0));
    }

    public function test_outstanding_excludes_received_and_cancelled_orders(): void
    {
        $admin = $this->userWithRole('admin');
        $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[10, '10.00']]);
        $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[10, '10.00']]);
        $approved = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00']]);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.outstanding', 1)
            ->where('purchases.outstanding.0.po_number', $approved->po_number));
    }

    // ------------------------------------------------------------------
    // Partial receiving visibility
    // ------------------------------------------------------------------

    public function test_partial_section_shows_only_line_level_partial_orders(): void
    {
        $admin = $this->userWithRole('admin');
        $partial = $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[10, '10.00', 4]]);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00', 0]]);
        $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[10, '10.00', 10]]);
        $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[10, '10.00', 4]]);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.partial', 1)
            ->where('purchases.partial.0.po_number', $partial->po_number)
            ->where('purchases.partial.0.ordered_quantity', 10)
            ->where('purchases.partial.0.received_quantity', 4)
            ->where('purchases.partial.0.remaining_quantity', 6));
    }

    // ------------------------------------------------------------------
    // Receiving
    // ------------------------------------------------------------------

    public function test_recent_receipts_show_grn_po_supplier_receiver_and_units(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $po = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00']], $supplier);
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 4]],
        ])->assertRedirect(route('admin.purchase-orders.show', $po));

        $receipt = DB::table('purchase_receipts')->where('purchase_order_id', $po->id)->firstOrFail();

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.recent_receipts', 1)
            ->where('purchases.recent_receipts.0.receipt_number', $receipt->receipt_number)
            ->where('purchases.recent_receipts.0.purchase_order.po_number', $po->po_number)
            ->where('purchases.recent_receipts.0.purchase_order.supplier.name', $supplier->name)
            ->where('purchases.recent_receipts.0.receiver.name', $admin->name)
            ->where('purchases.recent_receipts.0.units_received', 4));
    }

    public function test_recent_receipts_are_ordered_newest_first(): void
    {
        $admin = $this->userWithRole('admin');
        $po = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00']]);
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 4]],
        ])->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 3]],
        ])->assertSessionHasNoErrors();

        $receipts = DB::table('purchase_receipts')->orderBy('id')->get();

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.recent_receipts', 2)
            ->where('purchases.recent_receipts.0.receipt_number', $receipts[1]->receipt_number)
            ->where('purchases.recent_receipts.1.receipt_number', $receipts[0]->receipt_number));
    }

    // ------------------------------------------------------------------
    // Supplier activity
    // ------------------------------------------------------------------

    public function test_supplier_activity_aggregates_counts_open_orders_and_value(): void
    {
        $admin = $this->userWithRole('admin');
        $supplierA = $this->makeSupplier();
        $supplierB = $this->makeSupplier();

        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[4, '25.00']], $supplierA);        // 100 open
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[8, '25.00']], $supplierA);     // 200 open
        $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[1, '999.00']], $supplierA);   // excluded from value
        $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[1, '50.00']], $supplierA);     // 50 closed
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[3, '25.00']], $supplierB);     // 75 open

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.supplier_activity', 2)
            ->where('purchases.supplier_activity.0.id', $supplierA->id)
            ->where('purchases.supplier_activity.0.purchase_orders_count', 4)
            ->where('purchases.supplier_activity.0.open_purchase_orders_count', 2)
            ->where('purchases.supplier_activity.0.purchase_value', '350.00')
            ->where('purchases.supplier_activity.1.id', $supplierB->id)
            ->where('purchases.supplier_activity.1.purchase_orders_count', 1)
            ->where('purchases.supplier_activity.1.open_purchase_orders_count', 1)
            ->where('purchases.supplier_activity.1.purchase_value', '75.00'));
    }

    public function test_supplier_activity_lists_each_supplier_once(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();

        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $supplier);
        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $supplier);
        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $supplier);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.supplier_activity', 1)
            ->where('purchases.supplier_activity.0.id', $supplier->id)
            ->where('purchases.supplier_activity.0.purchase_orders_count', 3));
    }

    // ------------------------------------------------------------------
    // Recent purchase orders
    // ------------------------------------------------------------------

    public function test_recent_purchase_orders_are_ordered_newest_first(): void
    {
        $admin = $this->userWithRole('admin');
        $first = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']]);
        $second = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']]);
        $third = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']]);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.recent_purchase_orders', 3)
            ->where('purchases.recent_purchase_orders.0.po_number', $third->po_number)
            ->where('purchases.recent_purchase_orders.1.po_number', $second->po_number)
            ->where('purchases.recent_purchase_orders.2.po_number', $first->po_number));
    }

    public function test_recent_purchase_orders_list_is_limited_to_eight(): void
    {
        $admin = $this->userWithRole('admin');
        for ($i = 0; $i < 10; $i++) {
            $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']]);
        }

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('purchases.recent_purchase_orders', 8));
    }

    public function test_recent_purchase_orders_expose_supplier_total_and_status(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $po = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[8, '93.75']], $supplier); // 750.00

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('purchases.recent_purchase_orders.0.po_number', $po->po_number)
            ->where('purchases.recent_purchase_orders.0.supplier.name', $supplier->name)
            ->where('purchases.recent_purchase_orders.0.total', '750.00')
            ->where('purchases.recent_purchase_orders.0.status', PurchaseOrder::STATUS_APPROVED));

        $this->assertSame('750.00', $po->fresh()->total);
    }

    // ------------------------------------------------------------------
    // Cost display (Phase 16 foundation)
    // ------------------------------------------------------------------

    public function test_outstanding_and_partial_rows_expose_authoritative_po_totals(): void
    {
        $admin = $this->userWithRole('admin');
        $approved = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[8, '154.32']]); // 1234.56
        $partial = $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[4, '10.00', 2]]);

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('purchases.outstanding.0.total', '1234.56')
            ->where('purchases.partial.0.total', '40.00'));

        // Dashboard access never rewrites persisted cost values.
        $this->assertSame('1234.56', $approved->fresh()->total);
        $this->assertSame('154.32', $approved->items()->firstOrFail()->unit_cost);
        $this->assertSame('1234.56', $approved->items()->firstOrFail()->subtotal);
        $this->assertSame('40.00', $partial->fresh()->total);
    }

    // ------------------------------------------------------------------
    // Data integrity (read-only dashboard)
    // ------------------------------------------------------------------

    public function test_dashboard_does_not_modify_inventory_quantities(): void
    {
        $admin = $this->userWithRole('admin');
        $product = $this->makeVariant();
        $variant = $product->variants()->first();
        $variant->update(['quantity' => 7]);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00']]);

        $this->dashboard($admin)->assertOk();

        $this->assertSame(7, $variant->fresh()->quantity);
    }

    public function test_dashboard_creates_zero_stock_movements(): void
    {
        $admin = $this->userWithRole('admin');
        $po = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00']]);
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 4]],
        ])->assertSessionHasNoErrors();

        $before = StockMovement::count();
        $this->assertSame(1, $before);

        $this->dashboard($admin)->assertOk();

        $this->assertSame($before, StockMovement::count());
    }

    public function test_dashboard_does_not_modify_purchase_orders_receipts_or_received_quantities(): void
    {
        $admin = $this->userWithRole('admin');
        $po = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '10.00']]);
        $orderItem = $po->items()->firstOrFail();

        $this->actingAs($admin)->post(route('admin.purchase-orders.receive.store', $po), [
            'items' => [['purchase_order_item_id' => $orderItem->id, 'quantity' => 4]],
        ])->assertSessionHasNoErrors();

        $ordersBefore = DB::table('purchase_orders')->orderBy('id')->get();
        $itemsBefore = DB::table('purchase_order_items')->orderBy('id')->get(['id', 'quantity', 'unit_cost', 'subtotal', 'received_quantity']);
        $receiptsBefore = DB::table('purchase_receipts')->orderBy('id')->get();
        $movementsBefore = DB::table('stock_movements')->count();

        $this->dashboard($admin)->assertOk();

        $this->assertEquals($ordersBefore, DB::table('purchase_orders')->orderBy('id')->get());
        $this->assertEquals($itemsBefore, DB::table('purchase_order_items')->orderBy('id')->get(['id', 'quantity', 'unit_cost', 'subtotal', 'received_quantity']));
        $this->assertEquals($receiptsBefore, DB::table('purchase_receipts')->orderBy('id')->get());
        $this->assertSame($movementsBefore, DB::table('stock_movements')->count());
        $this->assertSame(4, $orderItem->fresh()->received_quantity);
        $this->assertSame(PurchaseOrder::STATUS_PARTIALLY_RECEIVED, $po->fresh()->status);
    }

    // ------------------------------------------------------------------
    // Authorization (same pattern as the purchasing routes)
    // ------------------------------------------------------------------

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('admin.purchases.dashboard'))->assertRedirect(route('login'));
    }

    public function test_staff_cannot_view_purchase_dashboard(): void
    {
        $this->dashboard($this->userWithRole('staff'))->assertForbidden();
    }

    public function test_manager_can_view_purchase_dashboard(): void
    {
        $this->dashboard($this->userWithRole('manager'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/PurchaseDashboard'));
    }

    public function test_admin_can_view_purchase_dashboard(): void
    {
        $this->dashboard($this->userWithRole('admin'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/PurchaseDashboard'));
    }

    public function test_super_admin_can_view_purchase_dashboard(): void
    {
        $this->dashboard($this->userWithRole('super_admin'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/PurchaseDashboard'));
    }

    // ------------------------------------------------------------------
    // Empty states
    // ------------------------------------------------------------------

    public function test_empty_dashboard_returns_zero_metrics_and_empty_lists(): void
    {
        $admin = $this->userWithRole('admin');

        $this->dashboard($admin)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('purchases.metrics.total_pos', 0)
            ->where('purchases.metrics.open', 0)
            ->where('purchases.metrics.partially_received', 0)
            ->where('purchases.metrics.received', 0)
            ->where('purchases.metrics.cancelled', 0)
            ->where('purchases.metrics.purchase_value', '0.00')
            ->where('purchases.metrics.suppliers_with_purchases', 0)
            ->where('purchases.outstanding', [])
            ->where('purchases.partial', [])
            ->where('purchases.recent_receipts', [])
            ->where('purchases.supplier_activity', [])
            ->where('purchases.recent_purchase_orders', []));
    }
}
