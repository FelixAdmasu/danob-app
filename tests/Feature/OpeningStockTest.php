<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpeningStockTest extends TestCase
{
    use RefreshDatabase;

    private function category(): Category
    {
        return Category::create(['name' => 'Cat', 'slug' => 'cat', 'is_active' => true]);
    }

    private function productWithVariant(int $quantity = 0): array
    {
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p-'.uniqid(), 'description' => 'D', 'status' => 'active']);
        $variant = $product->variants()->create(['name' => 'Default', 'quantity' => $quantity, 'is_active' => true]);

        return [$product, $variant];
    }

    public function test_admin_can_create_opening_stock(): void
    {
        [$product, $variant] = $this->productWithVariant(0);
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 100,
            'notes' => 'Initial',
        ]);

        $response->assertRedirect(route('admin.inventory.opening-stock'));
        $variant->refresh();
        $this->assertEquals(100, $variant->quantity);
        $movement = StockMovement::where('product_variant_id', $variant->id)->first();
        $this->assertNotNull($movement);
        $this->assertEquals('opening_balance', $movement->movement_type);
        $this->assertEquals(100, $movement->quantity);
        $this->assertEquals(0, $movement->quantity_before);
        $this->assertEquals(100, $movement->quantity_after);
        $this->assertEquals($admin->id, $movement->user_id);
    }

    public function test_manager_can_create_opening_stock(): void
    {
        [$product, $variant] = $this->productWithVariant(0);
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 50,
        ])->assertRedirect(route('admin.inventory.opening-stock'));
        $this->assertEquals(50, $variant->fresh()->quantity);
    }

    public function test_staff_cannot_create_opening_stock(): void
    {
        [$product, $variant] = $this->productWithVariant(0);
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 10,
        ])->assertForbidden();
    }

    public function test_unauthenticated_cannot_access(): void
    {
        [$product, $variant] = $this->productWithVariant(0);
        $this->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 10,
        ])->assertRedirect(route('login'));
        $this->get(route('admin.inventory.opening-stock'))->assertRedirect(route('login'));
    }

    public function test_invalid_quantity_rejected(): void
    {
        [$product, $variant] = $this->productWithVariant(0);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => -5,
        ])->assertSessionHasErrors('quantity');
        $this->actingAs($admin)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 'abc',
        ])->assertSessionHasErrors('quantity');
    }

    public function test_invalid_variant_product_relationship_rejected(): void
    {
        $cat = $this->category();
        $p1 = Product::create(['category_id' => $cat->id, 'name' => 'P1', 'slug' => 'p1', 'description' => 'D', 'status' => 'active']);
        $p2 = Product::create(['category_id' => $cat->id, 'name' => 'P2', 'slug' => 'p2', 'description' => 'D', 'status' => 'active']);
        $v1 = $p1->variants()->create(['name' => 'V1', 'quantity' => 0]);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $p2->id,
            'product_variant_id' => $v1->id,
            'quantity' => 10,
        ])->assertSessionHasErrors('product_variant_id');
    }

    public function test_existing_stock_cannot_be_overwritten(): void
    {
        [$product, $variant] = $this->productWithVariant(0);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 100,
        ])->assertRedirect(route('admin.inventory.opening-stock'));
        // second opening should fail
        $this->actingAs($admin)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 50,
        ])->assertSessionHasErrors('product_variant_id');
        $variant->refresh();
        $this->assertEquals(100, $variant->quantity);
        $this->assertEquals(1, StockMovement::where('product_variant_id', $variant->id)->count());
    }

    public function test_super_admin_can_create_opening_stock(): void
    {
        [$product, $variant] = $this->productWithVariant(0);
        $super = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($super)->post(route('admin.inventory.opening-stock.store'), [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 20,
        ])->assertRedirect(route('admin.inventory.opening-stock'));
        $this->assertEquals(20, $variant->fresh()->quantity);
    }

    public function test_get_opening_stock_requires_auth(): void
    {
        $this->get(route('admin.inventory.opening-stock'))->assertRedirect(route('login'));
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get(route('admin.inventory.opening-stock'))->assertOk();
    }
}
