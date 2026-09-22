<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockAdjustmentTest extends TestCase
{
    use RefreshDatabase;

    private function category(): Category
    {
        return Category::create(['name' => 'Cat', 'slug' => 'cat', 'is_active' => true]);
    }

    private function productWithVariant(int $quantity = 100): array
    {
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p-'.uniqid(), 'description' => 'D', 'status' => 'active']);
        $variant = $product->variants()->create(['name' => 'V1', 'quantity' => $quantity, 'is_active' => true]);

        // create opening balance to allow adjustments? For adjustment tests, we need existing stock
        // But opening stock already tested; here we test adjustments directly, so variant can have quantity without movements?
        // For ledger integrity, we can create variant with quantity and no movements, then adjustment will be first movement
        return [$product, $variant];
    }

    public function test_admin_can_access_adjustment_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get(route('admin.inventory.adjustments'))->assertOk();
    }

    public function test_manager_can_access_adjustment_page(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager)->get(route('admin.inventory.adjustments'))->assertOk();
    }

    public function test_super_admin_can_access_adjustment_page(): void
    {
        $super = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($super)->get(route('admin.inventory.adjustments'))->assertOk();
    }

    public function test_staff_cannot_access_adjustment_page(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get(route('admin.inventory.adjustments'))->assertForbidden();
    }

    public function test_unauthenticated_redirected(): void
    {
        $this->get(route('admin.inventory.adjustments'))->assertRedirect(route('login'));
        [$product, $variant] = $this->productWithVariant(100);
        $this->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 5,
            'reason' => 'Test',
        ])->assertRedirect(route('login'));
    }

    public function test_adjustment_in_increases_quantity(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 25,
            'reason' => 'Found stock',
        ])->assertRedirect(route('admin.inventory.adjustments'));
        $variant->refresh();
        $this->assertEquals(125, $variant->quantity);
        $movement = StockMovement::where('product_variant_id', $variant->id)->latest()->first();
        $this->assertEquals('adjustment_in', $movement->movement_type);
        $this->assertEquals(25, $movement->quantity);
        $this->assertEquals(100, $movement->quantity_before);
        $this->assertEquals(125, $movement->quantity_after);
        $this->assertEquals($admin->id, $movement->user_id);
        $this->assertEquals('Found stock', $movement->reason);
    }

    public function test_adjustment_out_decreases_quantity(): void
    {
        [$product, $variant] = $this->productWithVariant(125);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_out',
            'quantity' => 20,
            'reason' => 'Damaged',
        ])->assertRedirect(route('admin.inventory.adjustments'));
        $variant->refresh();
        $this->assertEquals(105, $variant->quantity);
        $movement = StockMovement::latest()->first();
        $this->assertEquals('adjustment_out', $movement->movement_type);
        $this->assertEquals(20, $movement->quantity);
        $this->assertEquals(125, $movement->quantity_before);
        $this->assertEquals(105, $movement->quantity_after);
    }

    public function test_quantity_cannot_be_zero(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 0,
            'reason' => 'Test',
        ])->assertSessionHasErrors('quantity');
    }

    public function test_quantity_cannot_be_negative(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => -5,
            'reason' => 'Test',
        ])->assertSessionHasErrors('quantity');
    }

    public function test_non_numeric_quantity_rejected(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 'abc',
            'reason' => 'Test',
        ])->assertSessionHasErrors('quantity');
    }

    public function test_invalid_adjustment_type_rejected(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'invalid_type',
            'quantity' => 5,
            'reason' => 'Test',
        ])->assertSessionHasErrors('adjustment_type');
    }

    public function test_missing_reason_rejected(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 5,
            'reason' => '',
        ])->assertSessionHasErrors('reason');
    }

    public function test_invalid_product_rejected(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => 99999,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 5,
            'reason' => 'Test',
        ])->assertSessionHasErrors('product_id');
    }

    public function test_invalid_variant_rejected(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => 99999,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 5,
            'reason' => 'Test',
        ])->assertSessionHasErrors('product_variant_id');
    }

    public function test_variant_belonging_to_another_product_rejected(): void
    {
        $cat = $this->category();
        $p1 = Product::create(['category_id' => $cat->id, 'name' => 'P1', 'slug' => 'p1', 'description' => 'D', 'status' => 'active']);
        $p2 = Product::create(['category_id' => $cat->id, 'name' => 'P2', 'slug' => 'p2', 'description' => 'D', 'status' => 'active']);
        $v1 = $p1->variants()->create(['name' => 'V1', 'quantity' => 100]);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $p2->id,
            'product_variant_id' => $v1->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 5,
            'reason' => 'Test',
        ])->assertSessionHasErrors('product_variant_id');
    }

    public function test_adjustment_out_cannot_produce_negative_stock(): void
    {
        [$product, $variant] = $this->productWithVariant(10);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_out',
            'quantity' => 15,
            'reason' => 'Test',
        ])->assertSessionHasErrors('quantity');
        $variant->refresh();
        $this->assertEquals(10, $variant->quantity);
        $this->assertEquals(0, StockMovement::where('product_variant_id', $variant->id)->count());
    }

    public function test_failed_adjustment_does_not_change_quantity_or_ledger(): void
    {
        [$product, $variant] = $this->productWithVariant(10);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_out',
            'quantity' => 20,
            'reason' => 'Test',
        ])->assertSessionHasErrors('quantity');
        $this->assertEquals(10, $variant->fresh()->quantity);
        $this->assertEquals(0, StockMovement::count());
    }

    public function test_successful_adjustment_creates_exactly_one_ledger(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 10,
            'reason' => 'Test',
        ])->assertRedirect(route('admin.inventory.adjustments'));
        $this->assertEquals(1, StockMovement::where('product_variant_id', $variant->id)->count());
    }

    public function test_multiple_adjustments_preserve_before_after(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 25,
            'reason' => 'First',
        ]);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_out',
            'quantity' => 20,
            'reason' => 'Second',
        ]);
        $movements = StockMovement::where('product_variant_id', $variant->id)->orderBy('id')->get();
        $this->assertEquals(2, $movements->count());
        $this->assertEquals(100, $movements[0]->quantity_before);
        $this->assertEquals(125, $movements[0]->quantity_after);
        $this->assertEquals(125, $movements[1]->quantity_before);
        $this->assertEquals(105, $movements[1]->quantity_after);
        $variant->refresh();
        $this->assertEquals(105, $variant->quantity);
    }

    public function test_user_id_recorded(): void
    {
        [$product, $variant] = $this->productWithVariant(100);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'adjustment_type' => 'adjustment_in',
            'quantity' => 5,
            'reason' => 'Test',
        ]);
        $movement = StockMovement::first();
        $this->assertEquals($admin->id, $movement->user_id);
    }
}
