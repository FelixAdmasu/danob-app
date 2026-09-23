<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeFeaturedImagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_homepage_featured_products_include_images(): void
    {
        $category = Category::create([
            'name' => 'Featured Category',
            'slug' => 'featured-category',
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Featured Product',
            'slug' => 'featured-product',
            'description' => 'A featured product',
            'status' => 'active',
        ]);

        ProductImage::create([
            'product_id' => $product->id,
            'url' => '/storage/products/featured-image.jpg',
            'sort_order' => 0,
            'is_primary' => true,
        ]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->has('featuredProducts', 1)
                ->has('featuredProducts.0.images', 1)
                ->where('featuredProducts.0.images.0.url', '/storage/products/featured-image.jpg')
                ->where('featuredProducts.0.images.0.is_primary', true));
    }

    public function test_homepage_featured_products_without_images_returns_empty_array(): void
    {
        $category = Category::create([
            'name' => 'Plain Category',
            'slug' => 'plain-category',
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Imageless Product',
            'slug' => 'imageless-product',
            'description' => 'No image yet',
            'status' => 'active',
        ]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->has('featuredProducts', 1)
                ->has('featuredProducts.0.images', 0));
    }
}
