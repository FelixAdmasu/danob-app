<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_homepage_returns_ok(): void
    {
        $response = $this->get(route('home'));
        $response->assertOk();
    }

    public function test_products_index_returns_ok(): void
    {
        $response = $this->get(route('products.index'));
        $response->assertOk();
    }

    public function test_product_detail_returns_ok_for_active_product(): void
    {
        $category = Category::create([
            'name' => 'Test Category',
            'slug' => 'test-category',
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Test Product',
            'slug' => 'test-product',
            'description' => 'A test product',
            'status' => 'active',
        ]);

        $response = $this->get(route('products.show', $product->slug));
        $response->assertOk();
    }

    public function test_inactive_products_not_displayed(): void
    {
        $category = Category::create([
            'name' => 'Test Category',
            'slug' => 'test-category',
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Active Product',
            'slug' => 'active-product',
            'description' => 'A visible product',
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Hidden Product',
            'slug' => 'hidden-product',
            'description' => 'A hidden product',
            'status' => 'inactive',
        ]);

        $response = $this->get(route('products.index'));
        $response->assertOk();
        $response->assertSuccessful();
    }

    public function test_invalid_category_returns_empty(): void
    {
        $response = $this->get('/products?category=nonexistent-slug');
        $response->assertOk();
        $response->assertSuccessful();
    }

    public function test_invalid_brand_returns_empty(): void
    {
        $response = $this->get('/products?brand=nonexistent-slug');
        $response->assertOk();
        $response->assertSuccessful();
    }

    public function test_product_search_works(): void
    {
        $category = Category::create([
            'name' => 'Test Category',
            'slug' => 'test-category',
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Vanilla Powder',
            'slug' => 'vanilla-powder',
            'description' => 'Vanilla flavor',
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Chocolate Mix',
            'slug' => 'chocolate-mix',
            'description' => 'Chocolate flavor',
            'status' => 'active',
        ]);

        $response = $this->get('/products?search=vanilla');
        $response->assertOk();
        $response->assertSuccessful();
    }

    public function test_product_category_filter_works(): void
    {
        $cat1 = Category::create([
            'name' => 'Cake Mixes',
            'slug' => 'cake-mixes',
            'is_active' => true,
        ]);
        $cat2 = Category::create([
            'name' => 'Chocolate',
            'slug' => 'chocolate-cocoa',
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $cat1->id,
            'name' => 'Vanilla Cake',
            'slug' => 'vanilla-cake',
            'description' => 'Vanilla cake mix',
            'status' => 'active',
        ]);
        Product::create([
            'category_id' => $cat2->id,
            'name' => 'Dark Chocolate',
            'slug' => 'dark-chocolate',
            'description' => 'Dark chocolate',
            'status' => 'active',
        ]);

        $response = $this->get('/products?category=cake-mixes');
        $response->assertOk();
        $response->assertSuccessful();
    }

    public function test_product_brand_filter_works(): void
    {
        $brand = Brand::create([
            'name' => 'BakeMate',
            'slug' => 'bakemate',
            'is_active' => true,
        ]);

        $category = Category::create([
            'name' => 'Cake Mixes',
            'slug' => 'cake-mixes',
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'BakeMate Cake',
            'slug' => 'bakemate-cake',
            'description' => 'By BakeMate',
            'status' => 'active',
            'brand_id' => $brand->id,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Other Cake',
            'slug' => 'other-cake',
            'description' => 'By other brand',
            'status' => 'active',
        ]);

        $response = $this->get('/products?brand=bakemate');
        $response->assertOk();
        $response->assertSuccessful();
    }

    public function test_combined_filters_work(): void
    {
        $cat = Category::create([
            'name' => 'Cake Mixes',
            'slug' => 'cake-mixes',
            'is_active' => true,
        ]);
        $brand = Brand::create([
            'name' => 'BakeMate',
            'slug' => 'bakemate',
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $cat->id,
            'brand_id' => $brand->id,
            'name' => 'BakeMate Vanilla',
            'slug' => 'bakemate-vanilla',
            'description' => 'Vanilla cake by BakeMate',
            'status' => 'active',
        ]);

        $response = $this->get('/products?search=vanilla&category=cake-mixes&brand=bakemate');
        $response->assertOk();
        $response->assertSuccessful();
    }

    public function test_pagination_preserves_query_string(): void
    {
        $category = Category::create([
            'name' => 'Cake Mixes',
            'slug' => 'cake-mixes',
            'is_active' => true,
        ]);

        for ($i = 1; $i <= 15; $i++) {
            Product::create([
                'category_id' => $category->id,
                'name' => "Product {$i}",
                'slug' => "product-{$i}",
                'description' => "Description {$i}",
                'status' => 'active',
            ]);
        }

        $response = $this->get('/products?category=cake-mixes&page=2');
        $response->assertOk();
        $this->assertStringContainsString('page=2', $response->getContent());
        $this->assertStringContainsString('category=cake-mixes', $response->getContent());
    }

    public function test_brands_index_returns_ok(): void
    {
        $response = $this->get(route('brands.index'));
        $response->assertOk();
    }

    public function test_branches_index_returns_ok(): void
    {
        $response = $this->get(route('branches.index'));
        $response->assertOk();
    }

    public function test_about_page_returns_ok(): void
    {
        $response = $this->get(route('about'));
        $response->assertOk();
    }

    public function test_contact_page_returns_ok(): void
    {
        $response = $this->get(route('contact'));
        $response->assertOk();
    }

    public function test_how_to_order_page_returns_ok(): void
    {
        $response = $this->get(route('how-to-order'));
        $response->assertOk();
    }

    public function test_public_routes_do_not_require_authentication(): void
    {
        $this->get(route('home'))->assertOk();
        $this->get(route('products.index'))->assertOk();
        $this->get(route('brands.index'))->assertOk();
        $this->get(route('branches.index'))->assertOk();
    }
}
