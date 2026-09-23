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
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InventoryReportsTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeVariant(
        int $quantity,
        ?int $threshold = null,
        string $productName = '',
        string $variantName = '',
        string $sku = '',
    ): ProductVariant {
        $category = Category::create([
            'name' => 'Cat '.uniqid(),
            'slug' => 'cat-'.uniqid(),
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => $productName !== '' ? $productName : 'Product '.uniqid(),
            'slug' => 'product-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);

        return $product->variants()->create([
            'name' => $variantName !== '' ? $variantName : 'Variant '.uniqid(),
            'sku' => $sku !== '' ? $sku : 'SKU-'.strtoupper(bin2hex(random_bytes(4))),
            'quantity' => $quantity,
            'low_stock_threshold' => $threshold,
            'is_active' => true,
        ]);
    }

    private function openStock(ProductVariant $variant, int $quantity, User $user): StockMovement
    {
        return app(InventoryService::class)->openingBalance($variant, $quantity, $user->id);
    }

    private function increaseStock(ProductVariant $variant, int $quantity, User $user, ?string $reason = 'Restock'): StockMovement
    {
        return app(InventoryService::class)->increase(
            $variant,
            $quantity,
            StockMovement::TYPE_ADJUSTMENT_IN,
            $reason,
            null,
            null,
            null,
            $user->id,
        );
    }

    private function decreaseStock(ProductVariant $variant, int $quantity, User $user, ?string $reason = 'Sale'): StockMovement
    {
        return app(InventoryService::class)->decrease(
            $variant,
            $quantity,
            StockMovement::TYPE_SALE,
            $reason,
            null,
            null,
            null,
            $user->id,
        );
    }

    // ── Report A: Inventory Movement Report ─────────────────────────

    public function test_rows_expose_persisted_ledger_fields_and_filter_aware_summary(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0, 10);
        $this->openStock($variant, 100, $admin);      // in  100
        $this->increaseStock($variant, 10, $admin);   // in   10
        $this->decreaseStock($variant, 5, $admin);    // out   5

        $this->actingAs($admin)->get(route('admin.reports.inventory-movements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/InventoryMovements')
                ->has('movements.data', 3)
                // Newest first (created_at DESC, id DESC), fields straight
                // from the persisted ledger.
                ->where('movements.data.0.movement_type', StockMovement::TYPE_SALE)
                ->where('movements.data.0.quantity', 5)
                ->where('movements.data.0.quantity_before', 110)
                ->where('movements.data.0.quantity_after', 105)
                ->where('movements.data.0.reason', 'Sale')
                ->where('movements.data.0.variant.product.name', $variant->product->name)
                ->where('movements.data.0.user.name', $admin->name)
                // Status vocabularies come from the backend constants.
                ->where('movement_types', StockMovement::TYPES)
                ->where('summary.movement_count', 3)
                ->where('summary.units_in', 110)
                ->where('summary.units_out', 5)
                ->whereNull('filters.movement_type')
                ->whereNull('filters.date_from')
                ->whereNull('filters.search'));
    }

    public function test_movement_type_filter_returns_only_matching_rows(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0);
        $this->openStock($variant, 30, $admin);
        $this->increaseStock($variant, 10, $admin);

        $this->actingAs($admin)
            ->get(route('admin.reports.inventory-movements', ['movement_type' => StockMovement::TYPE_ADJUSTMENT_IN]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 1)
                ->where('movements.data.0.movement_type', StockMovement::TYPE_ADJUSTMENT_IN)
                ->where('summary.movement_count', 1)
                ->where('summary.units_in', 10)
                ->where('summary.units_out', 0)
                ->where('filters.movement_type', StockMovement::TYPE_ADJUSTMENT_IN));
    }

    public function test_date_filters_are_inclusive_and_combined_with_type_filter(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $m1 = $this->openStock($variant, 1, $admin);
        $m2 = $this->increaseStock($variant, 2, $admin);
        $m3 = $this->decreaseStock($variant, 1, $admin);
        $m1->created_at = '2026-01-10 09:00:00';
        $m1->save();
        $m2->created_at = '2026-01-12 09:00:00';
        $m2->save();
        $m3->created_at = '2026-03-01 09:00:00';
        $m3->save();

        // Both bounds, inclusive on each end (m1 and m2 are the boundaries).
        $this->actingAs($admin)
            ->get(route('admin.reports.inventory-movements', ['date_from' => '2026-01-10', 'date_to' => '2026-01-12']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 2)
                ->where('movements.data.0.id', $m2->id)
                ->where('movements.data.1.id', $m1->id)
                ->where('summary.movement_count', 2)
                ->where('filters.date_from', '2026-01-10')
                ->where('filters.date_to', '2026-01-12'));

        // from only — m2 (01-12) and m3 (03-01) are both in range; newest first.
        $this->actingAs($admin)
            ->get(route('admin.reports.inventory-movements', ['date_from' => '2026-01-11']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 2)
                ->where('movements.data.0.id', $m3->id)
                ->where('movements.data.1.id', $m2->id)
                ->where('summary.movement_count', 2));

        // to only
        $this->actingAs($admin)
            ->get(route('admin.reports.inventory-movements', ['date_to' => '2026-01-11']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 1)
                ->where('movements.data.0.id', $m1->id));

        // Combination of date range + movement type.
        $this->actingAs($admin)
            ->get(route('admin.reports.inventory-movements', [
                'date_from' => '2026-01-10',
                'date_to' => '2026-01-31',
                'movement_type' => StockMovement::TYPE_ADJUSTMENT_IN,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 1)
                ->where('movements.data.0.id', $m2->id)
                ->where('summary.movement_count', 1));

        // No match: zero rows AND zero summary (an empty result is not a
        // "zeroed" bug — the summary tracks the filter).
        $this->actingAs($admin)
            ->get(route('admin.reports.inventory-movements', ['date_from' => '2026-02-01', 'date_to' => '2026-02-28']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 0)
                ->where('summary.movement_count', 0)
                ->where('summary.units_in', 0)
                ->where('summary.units_out', 0));
    }

    public function test_search_covers_reason_variant_sku_and_product_name(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0, null, 'ProdOmega', 'VarAlpha', 'SKU-ALPHA-1');
        $this->openStock($variant, 30, $admin);
        $this->increaseStock($variant, 5, $admin, 'ReasonOmega');

        $report = route('admin.reports.inventory-movements');

        // Both movements belong to the same variant, so the variant name and
        // SKU searches match both rows (proving those columns are searched);
        // only the custom reason matches the reason search.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'VarAlpha']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('movements.data', 2)->where('filters.search', 'VarAlpha'));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'SKU-ALPHA-1']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('movements.data', 2));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'ProdOmega']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('movements.data', 2));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'ReasonOmega']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('movements.data', 1));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'no-match-zzz']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 0)
                ->where('summary.movement_count', 0));
    }

    public function test_pagination_keeps_deterministic_order_and_filters_across_pages(): void
    {
        $admin = $this->userWithRole('admin');
        $ids = [];
        for ($i = 0; $i < 25; $i++) {
            $variant = $this->makeVariant(50);
            $ids[] = $this->increaseStock($variant, 1, $admin)->id;
        }
        $newestFirst = array_reverse($ids);

        $this->actingAs($admin)->get(route('admin.reports.inventory-movements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 20)
                ->where('movements.current_page', 1)
                ->where('movements.last_page', 2)
                ->where('movements.per_page', 20)
                ->where('movements.data.0.id', $newestFirst[0])
                ->where('movements.data.19.id', $newestFirst[19]));

        // Page 2 still applies the filter (withQueryString) and continues
        // the same deterministic order.
        $this->actingAs($admin)
            ->get(route('admin.reports.inventory-movements', [
                'page' => 2,
                'movement_type' => StockMovement::TYPE_ADJUSTMENT_IN,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 5)
                ->where('movements.current_page', 2)
                ->where('movements.data.0.id', $newestFirst[20])
                ->where('movements.data.4.id', $newestFirst[24])
                ->where('filters.movement_type', StockMovement::TYPE_ADJUSTMENT_IN));
    }

    public function test_reference_column_exposes_reference_type_id_and_loaded_model(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(50);
        $customer = Customer::create([
            'type' => 'individual',
            'company_name' => 'Ref Co',
            'contact_name' => 'Ref Person',
            'is_active' => true,
        ]);
        $order = Order::create([
            'reference_number' => 'ORD-REF-1',
            'customer_id' => $customer->id,
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => '0.00',
            'total' => '0.00',
            'ordered_at' => now()->toDateString(),
        ]);

        app(InventoryService::class)->increase(
            $variant,
            3,
            StockMovement::TYPE_PURCHASE,
            'Purchase',
            null,
            Order::class,
            $order->id,
            $admin->id,
        );

        $this->actingAs($admin)->get(route('admin.reports.inventory-movements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 1)
                ->where('movements.data.0.reference_type', Order::class)
                ->where('movements.data.0.reference_id', $order->id)
                // The morph reference is eager-loaded, not queried per row.
                ->where('movements.data.0.reference.id', $order->id)
                ->where('movements.data.0.reference.reference_number', 'ORD-REF-1'));
    }

    public function test_empty_state_returns_zeroed_summary(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)->get(route('admin.reports.inventory-movements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 0)
                ->where('summary.movement_count', 0)
                ->where('summary.units_in', 0)
                ->where('summary.units_out', 0));
    }

    // ── Report E: Low Stock Report (Phase 20 semantics reused) ─────

    public function test_low_stock_report_matches_authoritative_stock_status_and_phase20_counts(): void
    {
        $admin = $this->userWithRole('admin');
        $low = $this->makeVariant(7, 10);
        $out = $this->makeVariant(0, null);
        $in = $this->makeVariant(50, 10);
        $unmonitored = $this->makeVariant(50, null);

        $expectedStatuses = [
            $out->id => $out->stockStatus(),
            $low->id => $low->stockStatus(),
            $in->id => $in->stockStatus(),
            $unmonitored->id => $unmonitored->stockStatus(),
        ];

        $this->actingAs($admin)->get(route('admin.reports.low-stock'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/LowStock')
                // Default 'attention': the out-of-stock and low rows, ordered
                // by quantity then name (Phase 20 ordering).
                ->has('variants.data', 2)
                ->where('variants.data.0.id', $out->id)
                ->where('variants.data.1.id', $low->id)
                ->where('variants.data.0.stock_status', $expectedStatuses[$out->id])
                ->where('variants.data.1.stock_status', $expectedStatuses[$low->id])
                // Phase 20 global counts (not filter-scoped).
                ->where('counts.low', 1)
                ->where('counts.out', 1)
                ->where('counts.monitored', 2)
                ->where('filters.status', 'attention'));
    }

    public function test_low_stock_status_filters_and_monitored_view_match_the_phase20_page(): void
    {
        $admin = $this->userWithRole('admin');
        $low = $this->makeVariant(7, 10);
        $out = $this->makeVariant(0, null);
        $in = $this->makeVariant(50, 10);
        $unmonitored = $this->makeVariant(50, null);

        $report = route('admin.reports.low-stock');

        // low
        $this->actingAs($admin)->get($report.'?'.http_build_query(['status' => 'low']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 1)
                ->where('variants.data.0.id', $low->id)
                ->where('variants.data.0.stock_status', 'low_stock')
                ->where('filters.status', 'low'));

        // out
        $this->actingAs($admin)->get($report.'?'.http_build_query(['status' => 'out']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 1)
                ->where('variants.data.0.id', $out->id)
                ->where('variants.data.0.stock_status', 'out_of_stock'));

        // monitored: healthy + low monitored variants, unmonitored excluded
        $this->actingAs($admin)->get($report.'?'.http_build_query(['status' => 'monitored']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 2)
                ->where('variants.data.0.id', $low->id)
                ->where('variants.data.1.id', $in->id)
                ->where('variants.data.1.stock_status', 'in_stock'));

        // §43: the report agrees with the Phase 20 Low Stock page — both
        // queried against the same fixtures must expose the identical rows
        // and counts.
        $this->actingAs($admin)->get(route('admin.inventory.low-stock'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Inventory/LowStock')
                ->has('variants.data', 2)
                ->where('variants.data.0.id', $out->id)
                ->where('variants.data.1.id', $low->id)
                ->where('counts.low', 1)
                ->where('counts.out', 1)
                ->where('counts.monitored', 2));
    }

    public function test_threshold_boundary_and_disabled_monitoring_behave_like_phase20(): void
    {
        $admin = $this->userWithRole('admin');
        $zeroThreshold = $this->makeVariant(1, 0);    // qty > threshold → in_stock
        $atThreshold = $this->makeVariant(3, 3);      // qty = threshold → low_stock
        $belowThreshold = $this->makeVariant(2, 3);   // qty < threshold → low_stock
        $monitoringOff = $this->makeVariant(0, null); // monitoring off, still out

        $report = route('admin.reports.low-stock');

        // Attention: both low rows + the out row; the healthy zero-threshold
        // variant is excluded, and the monitoring-disabled variant still shows.
        $this->actingAs($admin)->get($report)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 3)
                ->where('variants.data.0.id', $monitoringOff->id)
                ->where('variants.data.1.id', $belowThreshold->id)
                ->where('variants.data.2.id', $atThreshold->id));

        // Monitored view includes the healthy boundary variant (in stock),
        // ordered by quantity: zeroThreshold (1), below (2), at (3).
        $this->actingAs($admin)->get($report.'?'.http_build_query(['status' => 'monitored']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 3)
                ->where('variants.data.0.id', $zeroThreshold->id)
                ->where('variants.data.0.stock_status', 'in_stock')
                ->where('variants.data.1.id', $belowThreshold->id)
                ->where('variants.data.2.id', $atThreshold->id));

        // Monitoring disabled but quantity is zero → still out of stock.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['status' => 'out']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 1)
                ->where('variants.data.0.id', $monitoringOff->id)
                ->where('variants.data.0.stock_status', 'out_of_stock'));
    }

    public function test_low_stock_search_filters_rows_but_keeps_global_counts(): void
    {
        $admin = $this->userWithRole('admin');
        $this->makeVariant(7, 10, 'ProdSearch', 'VarSearch', 'SKU-SEARCH-1');
        $this->makeVariant(50, 10);

        $report = route('admin.reports.low-stock');

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'ProdSearch']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 1)
                ->where('filters.search', 'ProdSearch'));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'VarSearch']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('variants.data', 1));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'SKU-SEARCH-1']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('variants.data', 1));

        // Empty rows, but the summary counts stay global (Phase 20 scope).
        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'no-match-zzz']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 0)
                ->where('counts.low', 1)
                ->where('counts.out', 0));
    }

    public function test_low_stock_report_pagination(): void
    {
        $admin = $this->userWithRole('admin');
        for ($i = 0; $i < 25; $i++) {
            $this->makeVariant(1, 10);
        }

        $expectedFirstId = ProductVariant::where('is_active', true)
            ->whereNotNull('low_stock_threshold')
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->orderBy('quantity')
            ->orderBy('name')
            ->value('id');

        $this->actingAs($admin)
            ->get(route('admin.reports.low-stock', ['page' => 2, 'status' => 'attention']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 5)
                ->where('variants.current_page', 2)
                ->where('variants.last_page', 2)
                ->where('variants.per_page', 20)
                ->where('filters.status', 'attention'));

        // Page 1 keeps the documented Phase 20 ordering.
        $this->actingAs($admin)->get(route('admin.reports.low-stock'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('variants.data', 20)
                ->where('variants.data.0.id', $expectedFirstId));
    }
}
