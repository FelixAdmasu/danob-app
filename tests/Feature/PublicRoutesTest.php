<?php

namespace Tests\Feature;

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
