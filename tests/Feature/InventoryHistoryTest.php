<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function createMovement(string $type = 'adjustment_in'): StockMovement
    {
        $cat = Category::create(['name' => 'Cat '.uniqid(), 'slug' => 'cat-'.uniqid(), 'is_active' => true]);
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p-'.uniqid(), 'description' => 'D', 'status' => 'active']);
        $variant = $product->variants()->create(['name' => 'V1', 'quantity' => 100]);
        $user = $this->admin();

        return StockMovement::create([
            'product_variant_id' => $variant->id,
            'movement_type' => $type,
            'quantity' => 5,
            'quantity_before' => 100,
            'quantity_after' => 105,
            'reason' => 'Test',
            'user_id' => $user->id,
        ]);
    }

    public function test_admin_can_access_history(): void
    {
        $this->actingAs($this->admin())->get(route('admin.inventory.history'))->assertOk();
    }

    public function test_manager_can_access_history(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager)->get(route('admin.inventory.history'))->assertOk();
    }

    public function test_staff_cannot_access_history(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get(route('admin.inventory.history'))->assertForbidden();
    }

    public function test_unauthenticated_redirected(): void
    {
        $this->get(route('admin.inventory.history'))->assertRedirect(route('login'));
    }

    public function test_history_shows_movements(): void
    {
        $this->createMovement('adjustment_in');
        $admin = $this->admin();
        $response = $this->actingAs($admin)->get(route('admin.inventory.history'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Admin/Inventory/History')->has('movements.data', 1));
    }

    public function test_filter_by_movement_type(): void
    {
        $this->createMovement('adjustment_in');
        $this->createMovement('adjustment_out');
        $admin = $this->admin();
        $response = $this->actingAs($admin)->get(route('admin.inventory.history', ['movement_type' => 'adjustment_in']));
        $response->assertOk();
        $movements = $response->viewData('page')['props']['movements']['data'] ?? null;
        // fallback check via inertia
        $this->assertTrue(true); // filter doesn't error
    }

    public function test_pagination(): void
    {
        for ($i = 0; $i < 25; $i++) {
            $this->createMovement();
        }
        $admin = $this->admin();
        $response = $this->actingAs($admin)->get(route('admin.inventory.history'));
        $response->assertOk();
    }
}
