<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryBrandTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    // Categories

    public function test_admin_can_view_category_page(): void
    {
        $this->actingAs($this->admin())->get(route('admin.categories.index'))->assertOk();
    }

    public function test_admin_can_create_category(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.categories.store'), [
            'name' => 'New Cat',
            'slug' => 'new-cat',
            'description' => 'Desc',
            'is_active' => true,
        ])->assertRedirect(route('admin.categories.index'));
        $this->assertDatabaseHas('categories', ['slug' => 'new-cat']);
    }

    public function test_admin_can_update_category(): void
    {
        $admin = $this->admin();
        $cat = Category::create(['name' => 'Old', 'slug' => 'old', 'is_active' => true]);
        $this->actingAs($admin)->put(route('admin.categories.update', $cat), [
            'name' => 'New Name',
            'slug' => 'old',
            'description' => 'Updated',
            'is_active' => false,
        ])->assertRedirect(route('admin.categories.index'));
        $this->assertDatabaseHas('categories', ['id' => $cat->id, 'name' => 'New Name', 'is_active' => false]);
    }

    public function test_admin_can_delete_unused_category(): void
    {
        $admin = $this->admin();
        $cat = Category::create(['name' => 'Temp', 'slug' => 'temp', 'is_active' => true]);
        $this->actingAs($admin)->delete(route('admin.categories.destroy', $cat))->assertRedirect(route('admin.categories.index'));
        $this->assertDatabaseMissing('categories', ['id' => $cat->id]);
    }

    public function test_category_name_uniqueness(): void
    {
        Category::create(['name' => 'Dup', 'slug' => 'dup', 'is_active' => true]);
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.categories.store'), [
            'name' => 'Dup2',
            'slug' => 'dup',
            'is_active' => true,
        ])->assertSessionHasErrors('slug');
    }

    public function test_category_with_products_cannot_be_deleted(): void
    {
        $admin = $this->admin();
        $cat = Category::create(['name' => 'WithProd', 'slug' => 'with-prod', 'is_active' => true]);
        Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p', 'description' => 'D', 'status' => 'active']);
        $response = $this->actingAs($admin)->delete(route('admin.categories.destroy', $cat));
        $response->assertRedirect(route('admin.categories.index'));
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('categories', ['id' => $cat->id]);
    }

    public function test_category_product_count(): void
    {
        $cat = Category::create(['name' => 'Cat', 'slug' => 'cat', 'is_active' => true]);
        Product::create(['category_id' => $cat->id, 'name' => 'P1', 'slug' => 'p1', 'description' => 'D', 'status' => 'active']);
        Product::create(['category_id' => $cat->id, 'name' => 'P2', 'slug' => 'p2', 'description' => 'D', 'status' => 'active']);
        $cat->refresh();
        $this->assertEquals(2, $cat->products()->count());
        $response = $this->actingAs($this->admin())->get(route('admin.categories.index'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('categories.data.0.products_count', 2));
    }

    public function test_staff_cannot_access_category_management(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get(route('admin.categories.index'))->assertForbidden();
        $this->actingAs($staff)->post(route('admin.categories.store'), [
            'name' => 'Nope', 'slug' => 'nope', 'is_active' => true,
        ])->assertForbidden();
    }

    public function test_unauthorized_cannot_access_category(): void
    {
        $this->get(route('admin.categories.index'))->assertRedirect(route('login'));
    }

    public function test_category_search_works(): void
    {
        Category::create(['name' => 'Cake Mixes', 'slug' => 'cake-mixes', 'is_active' => true]);
        Category::create(['name' => 'Chocolate', 'slug' => 'chocolate', 'is_active' => true]);
        $response = $this->actingAs($this->admin())->get(route('admin.categories.index', ['search' => 'cake']));
        $response->assertOk();
        $response->assertSee('Cake Mixes');
        $response->assertDontSee('Chocolate');
    }

    public function test_category_pagination_works(): void
    {
        for ($i = 1; $i <= 25; $i++) {
            Category::create(['name' => "Cat $i", 'slug' => "cat-$i", 'is_active' => true]);
        }
        $response = $this->actingAs($this->admin())->get(route('admin.categories.index', ['page' => 2]));
        $response->assertOk();
        $this->assertStringContainsString('page=2', $response->getContent());
    }

    // Brands

    public function test_admin_can_view_brand_page(): void
    {
        $this->actingAs($this->admin())->get(route('admin.brands.index'))->assertOk();
    }

    public function test_admin_can_create_brand(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post(route('admin.brands.store'), [
            'name' => 'New Brand',
            'slug' => 'new-brand',
            'description' => 'Desc',
            'is_active' => true,
        ])->assertRedirect(route('admin.brands.index'));
        $this->assertDatabaseHas('brands', ['slug' => 'new-brand']);
    }

    public function test_admin_can_update_brand(): void
    {
        $admin = $this->admin();
        $brand = Brand::create(['name' => 'Old', 'slug' => 'old-brand', 'is_active' => true]);
        $this->actingAs($admin)->put(route('admin.brands.update', $brand), [
            'name' => 'New Brand',
            'slug' => 'old-brand',
            'description' => 'Updated',
            'is_active' => false,
        ])->assertRedirect(route('admin.brands.index'));
        $this->assertDatabaseHas('brands', ['id' => $brand->id, 'name' => 'New Brand']);
    }

    public function test_admin_can_delete_unused_brand(): void
    {
        $admin = $this->admin();
        $brand = Brand::create(['name' => 'Temp', 'slug' => 'temp-brand', 'is_active' => true]);
        $this->actingAs($admin)->delete(route('admin.brands.destroy', $brand))->assertRedirect(route('admin.brands.index'));
        $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
    }

    public function test_brand_with_products_cannot_be_deleted(): void
    {
        $admin = $this->admin();
        $brand = Brand::create(['name' => 'WithProd', 'slug' => 'with-brand', 'is_active' => true]);
        $cat = Category::create(['name' => 'Cat', 'slug' => 'cat2', 'is_active' => true]);
        Product::create(['category_id' => $cat->id, 'brand_id' => $brand->id, 'name' => 'P', 'slug' => 'p-brand', 'description' => 'D', 'status' => 'active']);
        $response = $this->actingAs($admin)->delete(route('admin.brands.destroy', $brand));
        $response->assertRedirect(route('admin.brands.index'));
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('brands', ['id' => $brand->id]);
    }

    public function test_brand_product_count(): void
    {
        $brand = Brand::create(['name' => 'B', 'slug' => 'b', 'is_active' => true]);
        $cat = Category::create(['name' => 'Cat', 'slug' => 'cat3', 'is_active' => true]);
        Product::create(['category_id' => $cat->id, 'brand_id' => $brand->id, 'name' => 'P1', 'slug' => 'pb1', 'description' => 'D', 'status' => 'active']);
        $response = $this->actingAs($this->admin())->get(route('admin.brands.index'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('brands.data.0.products_count', 1));
    }

    public function test_staff_cannot_access_brand_management(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get(route('admin.brands.index'))->assertForbidden();
    }

    public function test_brand_search_works(): void
    {
        Brand::create(['name' => 'BakeMate', 'slug' => 'bakemate', 'is_active' => true]);
        Brand::create(['name' => 'Ramco', 'slug' => 'ramco', 'is_active' => true]);
        $response = $this->actingAs($this->admin())->get(route('admin.brands.index', ['search' => 'bake']));
        $response->assertOk();
        $response->assertSee('BakeMate');
        $response->assertDontSee('Ramco');
    }

    public function test_brand_pagination_works(): void
    {
        for ($i = 1; $i <= 25; $i++) {
            Brand::create(['name' => "Brand $i", 'slug' => "brand-$i", 'is_active' => true]);
        }
        $response = $this->actingAs($this->admin())->get(route('admin.brands.index', ['page' => 2]));
        $response->assertOk();
        $this->assertStringContainsString('page=2', $response->getContent());
    }
}
