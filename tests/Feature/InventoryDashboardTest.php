<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function makeVariant(int $quantity, ?int $threshold = null): ProductVariant
    {
        $cat = Category::create(['name' => 'Cat '.uniqid(), 'slug' => 'cat-'.uniqid(), 'is_active' => true]);
        $product = Product::create([
            'category_id' => $cat->id,
            'name' => 'Product '.uniqid(),
            'slug' => 'product-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);

        return $product->variants()->create([
            'name' => 'Variant '.uniqid(),
            'sku' => 'SKU-'.strtoupper(bin2hex(random_bytes(4))),
            'quantity' => $quantity,
            'low_stock_threshold' => $threshold,
            'is_active' => true,
        ]);
    }

    /**
     * low: low stock (monitored), out: out of stock, inMonitored: healthy and
     * monitored, inPlain: healthy and unmonitored, inactive: excluded from
     * every metric (including total units).
     */
    private function seedMetrics(): array
    {
        $low = $this->makeVariant(7, 10);
        $out = $this->makeVariant(0, null);
        $inMonitored = $this->makeVariant(50, 10);
        $inPlain = $this->makeVariant(50, null);
        $inactive = $this->makeVariant(999, 10);
        $inactive->update(['is_active' => false]);

        return compact('low', 'out', 'inMonitored', 'inPlain', 'inactive');
    }

    // ── Metrics ──────────────────────────────────────────────────────

    public function test_total_active_variants_and_total_units_metrics(): void
    {
        $this->seedMetrics();

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Dashboard')
                ->where('inventory.metrics.total_active', 4)
                ->where('inventory.metrics.total_units', 107));
    }

    public function test_in_low_out_and_monitored_counts(): void
    {
        $this->seedMetrics();

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('inventory.metrics.in_stock', 2)
                ->where('inventory.metrics.low_stock', 1)
                ->where('inventory.metrics.out_of_stock', 1)
                ->where('inventory.metrics.monitored', 2));
    }

    public function test_dashboard_metrics_match_authoritative_stock_status(): void
    {
        $this->seedMetrics();
        $active = ProductVariant::where('is_active', true)->get();

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('inventory.metrics.total_active', $active->count())
                ->where('inventory.metrics.in_stock', $active->filter(fn ($v) => $v->stockStatus() === 'in_stock')->count())
                ->where('inventory.metrics.low_stock', $active->filter(fn ($v) => $v->stockStatus() === 'low_stock')->count())
                ->where('inventory.metrics.out_of_stock', $active->filter(fn ($v) => $v->stockStatus() === 'out_of_stock')->count())
                ->where('inventory.metrics.total_units', (int) $active->sum('quantity')));
    }

    // ── Status consistency ───────────────────────────────────────────

    public function test_legacy_hardcoded_rule_is_no_longer_authoritative(): void
    {
        // quantity 3 without a threshold: the legacy `<= 5` rule called this
        // low stock; the authoritative rule says in_stock (monitoring off).
        $this->makeVariant(3, null);

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('inventory.metrics.low_stock', 0)
                ->where('inventory.metrics.in_stock', 1)
                ->missing('stats.low_stock_variants')
                ->missing('low_stock'));
    }

    public function test_threshold_change_updates_dashboard_status(): void
    {
        $variant = $this->makeVariant(7, null);
        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('inventory.metrics.in_stock', 1)
                ->where('inventory.metrics.low_stock', 0));

        $variant->update(['low_stock_threshold' => 10]);

        $this->actingAs($admin)->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('inventory.metrics.in_stock', 0)
                ->where('inventory.metrics.low_stock', 1));
    }

    public function test_zero_quantity_is_out_of_stock_without_threshold(): void
    {
        $this->makeVariant(0, null);

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('inventory.metrics.out_of_stock', 1)
                ->where('inventory.metrics.low_stock', 0)
                ->where('inventory.metrics.in_stock', 0));
    }

    // ── Low-stock / out-of-stock previews ────────────────────────────

    public function test_low_stock_preview_lists_attention_variants(): void
    {
        $low = $this->makeVariant(7, 10);
        $this->makeVariant(50, null);

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->has('inventory.low_stock', 1)
                ->where('inventory.low_stock.0.id', $low->id)
                ->where('inventory.low_stock.0.stock_status', 'low_stock')
                ->where('inventory.low_stock.0.low_stock_threshold', 10)
                ->where('inventory.low_stock.0.quantity', 7));
    }

    public function test_in_stock_variants_do_not_appear_in_attention_lists(): void
    {
        $seed = [
            'low' => $this->makeVariant(7, 10),
            'out' => $this->makeVariant(0, null),
            'in' => $this->makeVariant(50, 10),
        ];

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->has('inventory.low_stock', 1)
                ->where('inventory.low_stock.0.id', $seed['low']->id)
                ->has('inventory.out_of_stock', 1)
                ->where('inventory.out_of_stock.0.id', $seed['out']->id));
    }

    public function test_out_of_stock_preview_lists_out_variants(): void
    {
        $out = $this->makeVariant(0, null);
        $this->makeVariant(50, null);

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->has('inventory.out_of_stock', 1)
                ->where('inventory.out_of_stock.0.id', $out->id)
                ->where('inventory.out_of_stock.0.stock_status', 'out_of_stock')
                ->has('inventory.low_stock', 0));
    }

    public function test_previews_are_limited_to_five(): void
    {
        for ($i = 0; $i < 7; $i++) {
            $this->makeVariant(1, 10);
        }
        for ($i = 0; $i < 6; $i++) {
            $this->makeVariant(0, null);
        }

        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->has('inventory.low_stock', 5)
                ->has('inventory.out_of_stock', 5)
                ->where('inventory.metrics.low_stock', 7)
                ->where('inventory.metrics.out_of_stock', 6));
    }

    // ── Recent movements ─────────────────────────────────────────────

    public function test_recent_movements_render_with_correct_fields(): void
    {
        $admin = $this->admin();
        $variant = $this->makeVariant(100, 10);
        $service = app(InventoryService::class);
        $service->decrease($variant, 5, StockMovement::TYPE_SALE, 'Order #1', null, null, null, $admin->id);
        $service->increase($variant, 20, StockMovement::TYPE_PURCHASE, 'Restock', null, null, null, $admin->id);

        $this->actingAs($admin)->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('inventory.recent_movements', 2)
                ->where('inventory.recent_movements.0.movement_type', StockMovement::TYPE_PURCHASE)
                ->where('inventory.recent_movements.0.quantity', 20)
                ->where('inventory.recent_movements.0.quantity_before', 95)
                ->where('inventory.recent_movements.0.quantity_after', 115)
                ->where('inventory.recent_movements.0.reason', 'Restock')
                ->where('inventory.recent_movements.0.variant.name', $variant->name)
                ->where('inventory.recent_movements.0.variant.product.name', $variant->product->name)
                ->where('inventory.recent_movements.1.movement_type', StockMovement::TYPE_SALE)
                ->where('inventory.recent_movements.1.quantity', 5)
                ->where('inventory.recent_movements.1.quantity_before', 100)
                ->where('inventory.recent_movements.1.quantity_after', 95));
    }

    public function test_dashboard_access_creates_no_movements_or_modifies_data(): void
    {
        $variant = $this->makeVariant(7, 10);
        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();

        $this->assertSame(0, StockMovement::count());
        $variant->refresh();
        $this->assertSame(7, $variant->quantity);
        $this->assertSame(10, $variant->low_stock_threshold);
    }

    // ── Authorization ────────────────────────────────────────────────

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
    }

    public function test_staff_sees_dashboard_without_inventory_data(): void
    {
        $this->makeVariant(7, 10);
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Dashboard')
                ->where('inventory', null)
                ->has('stats')
                ->has('recent_orders'));
    }

    public function test_manager_receives_inventory_payload(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);

        $this->actingAs($manager)->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('inventory.metrics')->has('inventory.low_stock'));
    }

    public function test_admin_receives_inventory_payload(): void
    {
        $this->actingAs($this->admin())->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('inventory.metrics')->has('inventory.recent_movements')->has('recent_orders'));
    }

    public function test_super_admin_receives_inventory_payload(): void
    {
        $super = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($super)->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('inventory.metrics')->has('inventory.out_of_stock'));
    }

    // ── Recent purchase activity ─────────────────────────────────────

    public function test_recent_purchase_orders_render(): void
    {
        $admin = $this->admin();
        $supplier = Supplier::create(['name' => 'Dash Sup '.uniqid(), 'is_active' => true]);
        $po = PurchaseOrder::create([
            'po_number' => 'PO-DASH-'.uniqid(),
            'supplier_id' => $supplier->id,
            'created_by' => $admin->id,
            'status' => PurchaseOrder::STATUS_APPROVED,
            'ordered_at' => now()->toDateString(),
            'subtotal' => '100.00',
            'total' => '100.00',
        ]);

        $this->actingAs($admin)->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('inventory.recent_purchase_orders', 1)
                ->where('inventory.recent_purchase_orders.0.po_number', $po->po_number)
                ->where('inventory.recent_purchase_orders.0.supplier.name', $supplier->name)
                ->where('inventory.recent_purchase_orders.0.status', PurchaseOrder::STATUS_APPROVED)
                ->where('inventory.recent_purchase_orders.0.total', '100.00'));
    }

    // ── Cross-page status consistency ────────────────────────────────

    public function test_status_consistent_across_dashboard_low_stock_and_product_pages(): void
    {
        $variant = $this->makeVariant(7, 10);
        $zero = $this->makeVariant(0, null);
        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('inventory.metrics.low_stock', 1)
                ->where('inventory.metrics.out_of_stock', 1)
                ->has('inventory.low_stock', 1)
                ->where('inventory.low_stock.0.id', $variant->id)
                ->has('inventory.out_of_stock', 1)
                ->where('inventory.out_of_stock.0.id', $zero->id));

        $this->actingAs($admin)->get(route('admin.inventory.low-stock'))
            ->assertInertia(fn ($page) => $page->has('variants.data', 2)
                ->where('variants.data.0.id', $zero->id)
                ->where('variants.data.0.stock_status', 'out_of_stock')
                ->where('variants.data.1.id', $variant->id)
                ->where('variants.data.1.stock_status', 'low_stock'));

        $this->actingAs($admin)->get(route('admin.products.show', $variant->product_id))
            ->assertInertia(fn ($page) => $page->where('product.variants.0.stock_status', 'low_stock'));

        $this->actingAs($admin)->get(route('admin.products.show', $zero->product_id))
            ->assertInertia(fn ($page) => $page->where('product.variants.0.stock_status', 'out_of_stock'));
    }
}
