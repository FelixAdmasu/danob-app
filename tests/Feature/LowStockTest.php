<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LowStockTest extends TestCase
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

    private function seedAttentionVariants(): array
    {
        return [
            'low' => $this->makeVariant(7, 10),
            'out' => $this->makeVariant(0, null),
            'in' => $this->makeVariant(50, 10),
            'unmonitored' => $this->makeVariant(50, null),
        ];
    }

    // ── Threshold behaviour (authoritative stockStatus) ──────────────

    public function test_stock_status_is_in_stock_above_threshold(): void
    {
        $variant = $this->makeVariant(25, 10);

        $this->assertSame('in_stock', $variant->stockStatus());
        $this->assertSame('in_stock', $variant->stock_status);
        $this->assertSame('in_stock', $variant->toArray()['stock_status']);
    }

    public function test_stock_status_is_low_stock_at_threshold(): void
    {
        $variant = $this->makeVariant(10, 10);

        $this->assertSame('low_stock', $variant->stockStatus());
    }

    public function test_stock_status_is_low_stock_below_threshold(): void
    {
        $variant = $this->makeVariant(7, 10);

        $this->assertSame('low_stock', $variant->stockStatus());
    }

    public function test_stock_status_is_out_of_stock_at_zero_quantity(): void
    {
        $withThreshold = $this->makeVariant(0, 10);
        $withoutThreshold = $this->makeVariant(0, null);

        $this->assertSame('out_of_stock', $withThreshold->stockStatus());
        $this->assertSame('out_of_stock', $withoutThreshold->stockStatus());
    }

    public function test_stock_status_is_in_stock_with_zero_threshold(): void
    {
        $variant = $this->makeVariant(5, 0);

        $this->assertSame('in_stock', $variant->stockStatus());
    }

    public function test_null_threshold_disables_low_stock_monitoring(): void
    {
        $variant = $this->makeVariant(7, null);

        $this->assertNull($variant->low_stock_threshold);
        $this->assertSame('in_stock', $variant->stockStatus());
    }

    // ── Data integrity ───────────────────────────────────────────────

    public function test_status_calculation_does_not_modify_quantity_or_movements(): void
    {
        $variant = $this->makeVariant(7, 10);

        $this->assertSame('low_stock', $variant->stockStatus());
        $this->assertSame('low_stock', $variant->stock_status);
        $variant->toArray();

        $this->actingAs($this->admin())->get(route('admin.inventory.low-stock'))->assertOk();

        $variant->refresh();
        $this->assertSame(7, $variant->quantity);
        $this->assertSame(10, $variant->low_stock_threshold);
        $this->assertSame(0, StockMovement::where('product_variant_id', $variant->id)->count());
    }

    public function test_crossing_threshold_creates_no_stock_movement(): void
    {
        $admin = $this->admin();
        $variant = $this->makeVariant(11, 10);

        app(InventoryService::class)->decrease($variant, 2, StockMovement::TYPE_SALE, 'Sale', null, null, null, $admin->id);

        $variant->refresh();
        $this->assertSame(9, $variant->quantity);
        $this->assertSame(10, $variant->low_stock_threshold);
        $this->assertSame('low_stock', $variant->stockStatus());

        $movements = StockMovement::where('product_variant_id', $variant->id)->get();
        $this->assertCount(1, $movements);
        $this->assertSame(StockMovement::TYPE_SALE, $movements->first()->movement_type);
    }

    public function test_existing_inventory_operations_work_with_threshold_set(): void
    {
        $admin = $this->admin();
        $variant = $this->makeVariant(0, 5);
        $service = app(InventoryService::class);

        $service->openingBalance($variant, 50, $admin->id);
        $variant->refresh();
        $this->assertSame(50, $variant->quantity);
        $this->assertSame('in_stock', $variant->stockStatus());

        $service->decrease($variant, 45, StockMovement::TYPE_SALE, 'Sale', null, null, null, $admin->id);
        $variant->refresh();
        $this->assertSame(5, $variant->quantity);
        $this->assertSame('low_stock', $variant->stockStatus());
        $this->assertSame(2, StockMovement::where('product_variant_id', $variant->id)->count());
    }

    // ── Authorization ────────────────────────────────────────────────

    public function test_guest_redirected_to_login(): void
    {
        $this->get(route('admin.inventory.low-stock'))->assertRedirect(route('login'));
    }

    public function test_staff_cannot_access_low_stock_page(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get(route('admin.inventory.low-stock'))->assertForbidden();
    }

    public function test_manager_can_access_low_stock_page(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager)->get(route('admin.inventory.low-stock'))->assertOk();
    }

    public function test_admin_can_access_low_stock_page(): void
    {
        $this->actingAs($this->admin())->get(route('admin.inventory.low-stock'))->assertOk();
    }

    public function test_super_admin_can_access_low_stock_page(): void
    {
        $super = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($super)->get(route('admin.inventory.low-stock'))->assertOk();
    }

    public function test_threshold_update_follows_product_rbac(): void
    {
        $cat = Category::create(['name' => 'Cat '.uniqid(), 'slug' => 'cat-'.uniqid(), 'is_active' => true]);
        $product = Product::create([
            'category_id' => $cat->id,
            'name' => 'RBAC Product',
            'slug' => 'rbac-product-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);
        $variant = $product->variants()->create([
            'name' => 'V1',
            'sku' => 'SKU-RBAC-'.strtoupper(bin2hex(random_bytes(3))),
            'quantity' => 5,
            'low_stock_threshold' => null,
            'is_active' => true,
        ]);

        $payload = [
            'name' => $product->name,
            'slug' => $product->slug,
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'variants' => [
                ['id' => $variant->id, 'name' => 'V1', 'sku' => $variant->sku, 'quantity' => 5, 'low_stock_threshold' => 8],
            ],
        ];

        $this->put(route('admin.products.update', $product), $payload)->assertRedirect(route('login'));
        $this->assertNull($variant->fresh()->low_stock_threshold);

        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->put(route('admin.products.update', $product), $payload)->assertForbidden();
        $this->assertNull($variant->fresh()->low_stock_threshold);

        $this->actingAs($this->admin())->put(route('admin.products.update', $product), $payload)->assertRedirect(route('admin.products.index'));
        $this->assertSame(8, $variant->fresh()->low_stock_threshold);
    }

    // ── Page rendering, filters, search, variant data ────────────────

    public function test_page_renders_with_summary_counts(): void
    {
        $this->seedAttentionVariants();
        $inactive = $this->makeVariant(0, null);
        $inactive->update(['is_active' => false]);

        $response = $this->actingAs($this->admin())->get(route('admin.inventory.low-stock'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Admin/Inventory/LowStock')
            ->where('counts.low', 1)
            ->where('counts.out', 1)
            ->where('counts.monitored', 2)
            ->where('filters.status', 'attention')
            ->where('filters.search', null)
            ->has('variants.data', 2));
    }

    public function test_attention_filter_excludes_in_stock_variants(): void
    {
        $seed = $this->seedAttentionVariants();

        $this->actingAs($this->admin())->get(route('admin.inventory.low-stock'))
            ->assertInertia(fn ($page) => $page->has('variants.data', 2)
                ->where('variants.data.0.id', $seed['out']->id)
                ->where('variants.data.1.id', $seed['low']->id));
    }

    public function test_status_filters_select_low_out_and_monitored(): void
    {
        $seed = $this->seedAttentionVariants();
        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.inventory.low-stock', ['status' => 'low']))
            ->assertInertia(fn ($page) => $page->has('variants.data', 1)
                ->where('variants.data.0.id', $seed['low']->id)
                ->where('filters.status', 'low'));

        $this->actingAs($admin)->get(route('admin.inventory.low-stock', ['status' => 'out']))
            ->assertInertia(fn ($page) => $page->has('variants.data', 1)
                ->where('variants.data.0.id', $seed['out']->id));

        $this->actingAs($admin)->get(route('admin.inventory.low-stock', ['status' => 'monitored']))
            ->assertInertia(fn ($page) => $page->has('variants.data', 2)
                ->where('variants.data.0.id', $seed['low']->id)
                ->where('variants.data.1.id', $seed['in']->id));
    }

    public function test_search_filters_by_product_name_and_sku(): void
    {
        $seed = $this->seedAttentionVariants();
        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.inventory.low-stock', ['search' => $seed['low']->product->name]))
            ->assertInertia(fn ($page) => $page->has('variants.data', 1)
                ->where('variants.data.0.id', $seed['low']->id));

        $this->actingAs($admin)->get(route('admin.inventory.low-stock', ['search' => $seed['out']->sku]))
            ->assertInertia(fn ($page) => $page->has('variants.data', 1)
                ->where('variants.data.0.id', $seed['out']->id));

        $this->actingAs($admin)->get(route('admin.inventory.low-stock', ['search' => 'zzz-no-match']))
            ->assertInertia(fn ($page) => $page->has('variants.data', 0));
    }

    public function test_variant_rows_expose_threshold_and_status(): void
    {
        $seed = $this->seedAttentionVariants();

        $this->actingAs($this->admin())->get(route('admin.inventory.low-stock', ['status' => 'low']))
            ->assertInertia(fn ($page) => $page->has('variants.data', 1)
                ->where('variants.data.0.id', $seed['low']->id)
                ->where('variants.data.0.stock_status', 'low_stock')
                ->where('variants.data.0.low_stock_threshold', 10)
                ->where('variants.data.0.quantity', 7)
                ->where('variants.data.0.sku', $seed['low']->sku)
                ->where('variants.data.0.name', $seed['low']->name)
                ->where('variants.data.0.product.name', $seed['low']->product->name));
    }

    public function test_products_index_low_stock_count_uses_authoritative_status(): void
    {
        $cat = Category::create(['name' => 'Cat '.uniqid(), 'slug' => 'cat-'.uniqid(), 'is_active' => true]);
        $product = Product::create([
            'category_id' => $cat->id,
            'name' => 'Count Product',
            'slug' => 'count-product-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);
        // low (monitored), in stock (unmonitored), out, out but inactive.
        $product->variants()->create(['name' => 'Low', 'quantity' => 3, 'low_stock_threshold' => 10, 'is_active' => true]);
        $product->variants()->create(['name' => 'Healthy', 'quantity' => 4, 'low_stock_threshold' => null, 'is_active' => true]);
        $product->variants()->create(['name' => 'Gone', 'quantity' => 0, 'low_stock_threshold' => null, 'is_active' => true]);
        $product->variants()->create(['name' => 'Retired', 'quantity' => 0, 'low_stock_threshold' => null, 'is_active' => false]);

        $this->actingAs($this->admin())->get(route('admin.products.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Products/Index')
                ->where('products.data.0.id', $product->id)
                ->where('products.data.0.low_stock_variants_count', 2));
    }

    public function test_products_show_serializes_stock_status_and_threshold(): void
    {
        $variant = $this->makeVariant(7, 10);

        $this->actingAs($this->admin())->get(route('admin.products.show', $variant->product_id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Products/Show')
                ->where('product.variants.0.id', $variant->id)
                ->where('product.variants.0.stock_status', 'low_stock')
                ->where('product.variants.0.low_stock_threshold', 10));
    }

    // ── Threshold editing ────────────────────────────────────────────

    public function test_manager_can_set_and_clear_threshold(): void
    {
        $cat = Category::create(['name' => 'Cat '.uniqid(), 'slug' => 'cat-'.uniqid(), 'is_active' => true]);
        $product = Product::create([
            'category_id' => $cat->id,
            'name' => 'Threshold Product',
            'slug' => 'threshold-product-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);
        $variant = $product->variants()->create([
            'name' => 'V1',
            'sku' => 'SKU-TH-'.strtoupper(bin2hex(random_bytes(3))),
            'quantity' => 5,
            'low_stock_threshold' => null,
            'is_active' => true,
        ]);
        $manager = User::factory()->create(['role' => 'manager']);

        $payload = [
            'name' => $product->name,
            'slug' => $product->slug,
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'variants' => [
                ['id' => $variant->id, 'name' => 'V1', 'sku' => $variant->sku, 'quantity' => 5, 'low_stock_threshold' => 12],
            ],
        ];

        $this->actingAs($manager)->put(route('admin.products.update', $product), $payload)
            ->assertRedirect(route('admin.products.index'));
        $this->assertSame(12, $variant->fresh()->low_stock_threshold);
        $this->assertSame(5, $variant->fresh()->quantity);

        // Clearing the field disables monitoring again.
        unset($payload['variants'][0]['low_stock_threshold']);
        $this->actingAs($manager)->put(route('admin.products.update', $product), $payload)
            ->assertRedirect(route('admin.products.index'));
        $this->assertNull($variant->fresh()->low_stock_threshold);
    }

    public function test_invalid_threshold_rejected_by_validation(): void
    {
        $cat = Category::create(['name' => 'Cat '.uniqid(), 'slug' => 'cat-'.uniqid(), 'is_active' => true]);
        $product = Product::create([
            'category_id' => $cat->id,
            'name' => 'Validation Product',
            'slug' => 'validation-product-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);
        $variant = $product->variants()->create([
            'name' => 'V1',
            'sku' => 'SKU-VAL-'.strtoupper(bin2hex(random_bytes(3))),
            'quantity' => 5,
            'low_stock_threshold' => 10,
            'is_active' => true,
        ]);
        $admin = $this->admin();

        $payload = [
            'name' => $product->name,
            'slug' => $product->slug,
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'variants' => [
                ['id' => $variant->id, 'name' => 'V1', 'sku' => $variant->sku, 'quantity' => 5, 'low_stock_threshold' => -1],
            ],
        ];

        $this->actingAs($admin)->put(route('admin.products.update', $product), $payload)
            ->assertSessionHasErrors('variants.0.low_stock_threshold');
        $this->assertSame(10, $variant->fresh()->low_stock_threshold);

        $payload['variants'][0]['low_stock_threshold'] = 'abc';
        $this->actingAs($admin)->put(route('admin.products.update', $product), $payload)
            ->assertSessionHasErrors('variants.0.low_stock_threshold');
        $this->assertSame(10, $variant->fresh()->low_stock_threshold);
    }

    public function test_threshold_saved_when_creating_product(): void
    {
        $cat = Category::create(['name' => 'Cat '.uniqid(), 'slug' => 'cat-'.uniqid(), 'is_active' => true]);
        $slug = 'new-threshold-product-'.uniqid();

        $this->actingAs($this->admin())->post(route('admin.products.store'), [
            'name' => 'New Threshold Product',
            'slug' => $slug,
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'variants' => [
                ['name' => 'Default', 'quantity' => 4, 'low_stock_threshold' => 8],
            ],
        ])->assertRedirect(route('admin.products.index'));

        $variant = Product::where('slug', $slug)->firstOrFail()->variants()->first();
        $this->assertSame(8, $variant->low_stock_threshold);
        $this->assertSame('low_stock', $variant->stockStatus());
    }
}
