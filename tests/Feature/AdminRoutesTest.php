<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_cannot_access_admin_dashboard(): void
    {
        $response = $this->get(route('admin.dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->get(route('admin.dashboard'));
        $response->assertOk();
    }

    public function test_manager_can_access_admin_dashboard(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);

        $response = $this->get(route('admin.dashboard'));
        $response->assertOk();
    }

    public function test_staff_can_access_admin_dashboard(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->get(route('admin.dashboard'));
        $response->assertOk();
    }

    public function test_admin_can_access_products_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->get(route('admin.products.index'));
        $response->assertOk();
    }

    public function test_manager_can_access_products_index(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);

        $response = $this->get(route('admin.products.index'));
        $response->assertOk();
    }

    public function test_staff_cannot_access_products_index(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->get(route('admin.products.index'));
        $response->assertForbidden();
    }

    public function test_admin_can_access_categories_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->get(route('admin.categories.index'));
        $response->assertOk();
    }

    public function test_manager_can_access_categories_index(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);

        $response = $this->get(route('admin.categories.index'));
        $response->assertOk();
    }

    public function test_staff_cannot_access_categories_index(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->get(route('admin.categories.index'));
        $response->assertForbidden();
    }

    public function test_admin_can_access_brands_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->get(route('admin.brands.index'));
        $response->assertOk();
    }

    public function test_manager_can_access_brands_index(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);

        $response = $this->get(route('admin.brands.index'));
        $response->assertOk();
    }

    public function test_staff_cannot_access_brands_index(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->get(route('admin.brands.index'));
        $response->assertForbidden();
    }

    public function test_admin_can_access_branches_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->get(route('admin.branches.index'));
        $response->assertOk();
    }

    public function test_manager_can_access_branches_index(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);

        $response = $this->get(route('admin.branches.index'));
        $response->assertOk();
    }

    public function test_staff_cannot_access_branches_index(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->get(route('admin.branches.index'));
        $response->assertForbidden();
    }

    public function test_admin_can_access_orders_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->get(route('admin.orders.index'));
        $response->assertOk();
    }

    public function test_manager_can_access_orders_index(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);

        $response = $this->get(route('admin.orders.index'));
        $response->assertOk();
    }

    public function test_staff_can_access_orders_index(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->get(route('admin.orders.index'));
        $response->assertOk();
    }

    public function test_admin_can_access_customers_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->get(route('admin.customers.index'));
        $response->assertOk();
    }

    public function test_manager_can_access_customers_index(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);

        $response = $this->get(route('admin.customers.index'));
        $response->assertOk();
    }

    public function test_staff_can_access_customers_index(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->get(route('admin.customers.index'));
        $response->assertOk();
    }

    public function test_admin_can_create_category(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->post(route('admin.categories.store'), [
            'name' => 'Test Category',
            'slug' => 'test-category',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('admin.categories.index'));
        $this->assertDatabaseHas('categories', ['slug' => 'test-category']);
    }

    public function test_staff_cannot_create_category(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->post(route('admin.categories.store'), [
            'name' => 'Staff Category',
            'slug' => 'staff-category',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('categories', ['slug' => 'staff-category']);
    }
}
