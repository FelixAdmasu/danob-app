<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ProductCatalogTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function category(): Category
    {
        return Category::create(['name' => 'Cat', 'slug' => 'cat', 'is_active' => true]);
    }

    private function brand(): Brand
    {
        return Brand::create(['name' => 'Brand', 'slug' => 'brand', 'is_active' => true]);
    }

    public function test_admin_can_create_product_with_variants_and_images(): void
    {
        $admin = $this->admin();
        $cat = $this->category();
        $brand = $this->brand();

        $this->actingAs($admin)->post(route('admin.products.store'), [
            'name' => 'New Product',
            'slug' => 'new-product',
            'category_id' => $cat->id,
            'brand_id' => $brand->id,
            'description' => 'Desc',
            'status' => 'active',
            'variants' => [
                ['name' => '1kg', 'sku' => 'SKU-001', 'unit' => 'kg', 'quantity' => 1, 'public_price' => '12.50', 'is_active' => true],
            ],
            'images' => [
                ['url' => 'https://example.com/img.jpg', 'alt_text' => 'Alt', 'sort_order' => 0, 'is_primary' => true],
            ],
        ])->assertRedirect(route('admin.products.index'));

        $this->assertDatabaseHas('products', ['slug' => 'new-product']);
        $product = Product::where('slug', 'new-product')->first();
        $this->assertCount(1, $product->variants);
        $this->assertEquals('SKU-001', $product->variants->first()->sku);
        $this->assertCount(1, $product->images);
        $this->assertEquals('Alt', $product->images->first()->alt_text);
        $this->assertTrue($product->images->first()->is_primary);
    }

    public function test_admin_can_update_product_and_persist_variants(): void
    {
        $admin = $this->admin();
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p', 'description' => 'D', 'status' => 'active']);
        $variant = $product->variants()->create(['name' => 'Old', 'sku' => 'OLD', 'unit' => 'kg', 'quantity' => 1, 'public_price' => '10.00', 'is_active' => true]);

        $this->actingAs($admin)->put(route('admin.products.update', $product), [
            'name' => 'P Updated',
            'slug' => 'p',
            'category_id' => $cat->id,
            'brand_id' => null,
            'description' => 'D2',
            'status' => 'active',
            'variants' => [
                ['id' => $variant->id, 'name' => 'Updated', 'sku' => 'OLD', 'unit' => 'kg', 'quantity' => 2, 'public_price' => '20.00', 'is_active' => false],
                ['name' => 'New Variant', 'sku' => 'NEW', 'unit' => 'g', 'quantity' => 500, 'public_price' => '5.00', 'is_active' => true],
            ],
            'images' => [],
        ])->assertRedirect(route('admin.products.index'));

        $product->refresh();
        $this->assertEquals('P Updated', $product->name);
        $this->assertCount(2, $product->variants);
        $this->assertTrue($product->variants->where('sku', 'OLD')->first()->is_active === false);
        $this->assertEquals(2, $product->variants->where('sku', 'OLD')->first()->quantity);
    }

    public function test_variant_persistence_deletes_removed_variants(): void
    {
        $admin = $this->admin();
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p2', 'description' => 'D', 'status' => 'active']);
        $v1 = $product->variants()->create(['name' => 'V1', 'sku' => 'V1', 'quantity' => 1, 'is_active' => true]);
        $v2 = $product->variants()->create(['name' => 'V2', 'sku' => 'V2', 'quantity' => 1, 'is_active' => true]);

        $this->actingAs($admin)->put(route('admin.products.update', $product), [
            'name' => 'P',
            'slug' => 'p2',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'variants' => [
                ['id' => $v1->id, 'name' => 'V1', 'sku' => 'V1', 'quantity' => 1, 'is_active' => true],
            ],
            'images' => [],
        ])->assertRedirect(route('admin.products.index'));

        $this->assertDatabaseMissing('product_variants', ['id' => $v2->id]);
        $this->assertDatabaseHas('product_variants', ['id' => $v1->id]);
    }

    public function test_image_persistence_with_alt_text_and_primary(): void
    {
        $admin = $this->admin();
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p3', 'description' => 'D', 'status' => 'active']);
        $img = $product->images()->create(['url' => 'https://a.com/old.jpg', 'sort_order' => 0, 'is_primary' => false, 'alt_text' => 'Old']);

        $this->actingAs($admin)->put(route('admin.products.update', $product), [
            'name' => 'P',
            'slug' => 'p3',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'variants' => [],
            'images' => [
                ['id' => $img->id, 'url' => 'https://a.com/new.jpg', 'sort_order' => 2, 'is_primary' => true, 'alt_text' => 'New Alt'],
            ],
        ])->assertRedirect(route('admin.products.index'));

        $product->refresh();
        $this->assertCount(1, $product->images);
        $this->assertEquals('New Alt', $product->images->first()->alt_text);
        $this->assertTrue($product->images->first()->is_primary);
        $this->assertEquals(2, $product->images->first()->sort_order);
    }

    public function test_product_image_alt_text_nullable(): void
    {
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p4', 'description' => 'D', 'status' => 'active']);
        $image = $product->images()->create(['url' => 'https://a.com/img.jpg', 'sort_order' => 0, 'is_primary' => false, 'alt_text' => null]);
        $this->assertNull($image->alt_text);
        $image->update(['alt_text' => 'Alt']);
        $this->assertEquals('Alt', $image->fresh()->alt_text);
    }

    public function test_staff_cannot_create_product(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $cat = $this->category();
        $this->actingAs($staff)->post(route('admin.products.store'), [
            'name' => 'Nope',
            'slug' => 'nope',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
        ])->assertForbidden();
    }

    public function test_public_inactive_products_hidden(): void
    {
        $cat = $this->category();
        $active = Product::create(['category_id' => $cat->id, 'name' => 'Active', 'slug' => 'active', 'description' => 'D', 'status' => 'active']);
        $inactive = Product::create(['category_id' => $cat->id, 'name' => 'Inactive', 'slug' => 'inactive', 'description' => 'D', 'status' => 'inactive']);

        $this->get(route('products.show', $active->slug))->assertOk();
        $this->get(route('products.show', $inactive->slug))->assertNotFound();
    }

    public function test_public_product_page_displays_active_variants(): void
    {
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p5', 'description' => 'D', 'status' => 'active']);
        $product->variants()->create(['name' => 'Active V', 'sku' => 'A', 'quantity' => 1, 'public_price' => '10.00', 'is_active' => true]);
        $product->variants()->create(['name' => 'Inactive V', 'sku' => 'B', 'quantity' => 1, 'public_price' => '20.00', 'is_active' => false]);

        $response = $this->get(route('products.show', $product->slug));
        $response->assertOk();
        // Should contain active variant but the page will filter inactive in React, we just ensure product loads
        $response->assertSee('Active V');
    }

    public function test_product_index_handles_no_image_and_no_price(): void
    {
        $cat = $this->category();
        Product::create(['category_id' => $cat->id, 'name' => 'NoImgNoPrice', 'slug' => 'no-img', 'description' => 'D', 'status' => 'active']);

        $response = $this->get(route('products.index'));
        $response->assertOk();
        // Should not error when product has no image and no variant price
        $response->assertSee('NoImgNoPrice');
    }

    public function test_product_index_shows_primary_image_when_available(): void
    {
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'WithImg', 'slug' => 'with-img', 'description' => 'D', 'status' => 'active']);
        $product->images()->create(['url' => 'https://example.com/primary.jpg', 'sort_order' => 0, 'is_primary' => true, 'alt_text' => 'Primary']);

        $response = $this->get(route('products.index'));
        $response->assertOk();
        // Inertia JSON escapes slashes, so check for substring
        $response->assertSee('primary.jpg');
    }

    // ------------------------------------------------------------------
    // Phase 27 — advanced filtering (category / brand / status)
    // ------------------------------------------------------------------

    private function namedCategory(string $name): Category
    {
        return Category::create(['name' => $name, 'slug' => Str::slug($name).'-'.uniqid(), 'is_active' => true]);
    }

    private function namedBrand(string $name): Brand
    {
        return Brand::create(['name' => $name, 'slug' => Str::slug($name).'-'.uniqid(), 'is_active' => true]);
    }

    private function names(TestResponse $response): array
    {
        return array_column($response->inertiaProps('products.data'), 'name');
    }

    public function test_product_index_filters_by_category(): void
    {
        $admin = $this->admin();
        $catA = $this->namedCategory('Pastries');
        $catB = $this->namedCategory('Beverages');
        Product::create(['category_id' => $catA->id, 'name' => 'Croissant', 'slug' => 'croissant', 'description' => 'D', 'status' => 'active']);
        Product::create(['category_id' => $catA->id, 'name' => 'Muffin', 'slug' => 'muffin', 'description' => 'D', 'status' => 'active']);
        Product::create(['category_id' => $catB->id, 'name' => 'Latte', 'slug' => 'latte', 'description' => 'D', 'status' => 'active']);

        $response = $this->actingAs($admin)->get(route('admin.products.index', ['category_id' => $catA->id]));

        $response->assertOk();
        $this->assertEqualsCanonicalizing(['Croissant', 'Muffin'], $this->names($response));
        $this->assertSame($catA->id, $response->inertiaProps('filters.category_id'));
    }

    public function test_product_index_filters_by_brand(): void
    {
        $admin = $this->admin();
        $cat = $this->namedCategory('General');
        $brandX = $this->namedBrand('Northwind');
        $brandY = $this->namedBrand('Contoso');
        Product::create(['category_id' => $cat->id, 'brand_id' => $brandX->id, 'name' => 'Widget', 'slug' => 'widget', 'description' => 'D', 'status' => 'active']);
        Product::create(['category_id' => $cat->id, 'brand_id' => $brandY->id, 'name' => 'Gadget', 'slug' => 'gadget', 'description' => 'D', 'status' => 'active']);

        $response = $this->actingAs($admin)->get(route('admin.products.index', ['brand_id' => $brandX->id]));

        $response->assertOk();
        $this->assertSame(['Widget'], $this->names($response));
        $this->assertSame($brandX->id, $response->inertiaProps('filters.brand_id'));
    }

    public function test_product_index_filters_by_status(): void
    {
        $admin = $this->admin();
        $cat = $this->namedCategory('General');
        Product::create(['category_id' => $cat->id, 'name' => 'Live', 'slug' => 'live', 'description' => 'D', 'status' => 'active']);
        Product::create(['category_id' => $cat->id, 'name' => 'Hidden', 'slug' => 'hidden', 'description' => 'D', 'status' => 'inactive']);

        $response = $this->actingAs($admin)->get(route('admin.products.index', ['status' => 'inactive']));

        $response->assertOk();
        $this->assertSame(['Hidden'], $this->names($response));
        $this->assertSame('inactive', $response->inertiaProps('filters.status'));
    }

    public function test_product_index_combines_search_category_brand_and_status(): void
    {
        $admin = $this->admin();
        $catA = $this->namedCategory('Pastries');
        $catB = $this->namedCategory('Beverages');
        $brandX = $this->namedBrand('Northwind');
        $brandY = $this->namedBrand('Contoso');
        Product::create(['category_id' => $catA->id, 'brand_id' => $brandX->id, 'name' => 'Alpha Croissant', 'slug' => 'alpha-croissant', 'description' => 'D', 'status' => 'active']);
        Product::create(['category_id' => $catA->id, 'brand_id' => $brandY->id, 'name' => 'Alpha Muffin', 'slug' => 'alpha-muffin', 'description' => 'D', 'status' => 'inactive']);
        Product::create(['category_id' => $catB->id, 'brand_id' => $brandX->id, 'name' => 'Beta Latte', 'slug' => 'beta-latte', 'description' => 'D', 'status' => 'active']);

        // search + category
        $response = $this->actingAs($admin)->get(route('admin.products.index', ['search' => 'Alpha', 'category_id' => $catA->id]));
        $this->assertEqualsCanonicalizing(['Alpha Croissant', 'Alpha Muffin'], $this->names($response));

        // search + category + status
        $response = $this->actingAs($admin)->get(route('admin.products.index', ['search' => 'Alpha', 'category_id' => $catA->id, 'status' => 'active']));
        $this->assertSame(['Alpha Croissant'], $this->names($response));

        // search + brand
        $response = $this->actingAs($admin)->get(route('admin.products.index', ['search' => 'a', 'brand_id' => $brandX->id]));
        $this->assertEqualsCanonicalizing(['Alpha Croissant', 'Beta Latte'], $this->names($response));

        // combined filters that legitimately match nothing
        $response = $this->actingAs($admin)->get(route('admin.products.index', ['search' => 'nomatch', 'category_id' => $catA->id, 'brand_id' => $brandX->id, 'status' => 'inactive']));
        $response->assertOk();
        $this->assertSame([], $this->names($response));
    }

    public function test_product_index_rejects_invalid_filter_values(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.products.index', ['status' => 'bogus']))
            ->assertSessionHasErrors('status');
        $this->actingAs($admin)->get(route('admin.products.index', ['category_id' => 999999]))
            ->assertSessionHasErrors('category_id');
        $this->actingAs($admin)->get(route('admin.products.index', ['brand_id' => 'not-a-number']))
            ->assertSessionHasErrors('brand_id');
    }

    public function test_product_index_filter_state_survives_pagination(): void
    {
        $admin = $this->admin();
        $catA = $this->namedCategory('Bulk Category');
        $catB = $this->namedCategory('Other Category');
        foreach (range(1, 21) as $i) {
            Product::create(['category_id' => $catA->id, 'name' => "Bulk {$i}", 'slug' => "bulk-{$i}", 'description' => 'D', 'status' => 'active']);
        }
        Product::create(['category_id' => $catB->id, 'name' => 'Outside', 'slug' => 'outside', 'description' => 'D', 'status' => 'active']);

        $response = $this->actingAs($admin)->get(route('admin.products.index', ['category_id' => $catA->id]));
        $this->assertCount(20, $response->inertiaProps('products.data'));

        $next = $response->inertiaProps('products.next_page_url');
        $this->assertIsString($next);
        $this->assertStringContainsString('category_id='.$catA->id, $next);

        $pageTwo = $this->get($next);
        $pageTwo->assertOk();
        $data = $pageTwo->inertiaProps('products.data');
        $this->assertCount(1, $data);
        $this->assertSame($catA->id, $data[0]['category']['id']);
        $this->assertSame($catA->id, $pageTwo->inertiaProps('filters.category_id'));
    }

    public function test_product_index_exposes_filter_options_for_both_roles(): void
    {
        $cat = $this->namedCategory('Option Cat');
        $brand = $this->namedBrand('Option Brand');

        foreach (['admin', 'manager'] as $role) {
            $response = $this->actingAs(User::factory()->create(['role' => $role]))->get(route('admin.products.index'));

            $response->assertOk();
            $categories = array_column($response->inertiaProps('categories'), 'name');
            $brands = array_column($response->inertiaProps('brands'), 'name');
            $this->assertContains($cat->name, $categories, "Category options missing for {$role}.");
            $this->assertContains($brand->name, $brands, "Brand options missing for {$role}.");
        }
    }
}
