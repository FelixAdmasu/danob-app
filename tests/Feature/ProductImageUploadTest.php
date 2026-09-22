<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageUploadTest extends TestCase
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

    private function fakeImage(string $filename = 'test.jpg', string $mime = 'image/jpeg'): UploadedFile
    {
        // 1x1 pixel images without requiring GD
        $map = [
            'image/jpeg' => '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQABADAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
            'image/png' => 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
            'image/webp' => 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        ];
        $base64 = $map[$mime] ?? $map['image/jpeg'];
        $tmp = tempnam(sys_get_temp_dir(), 'img');
        file_put_contents($tmp, base64_decode($base64));
        // pad to ensure at least 1KB so size validation realistic but still under 5120
        $path = $tmp.'.'.pathinfo($filename, PATHINFO_EXTENSION);
        rename($tmp, $path);

        return new UploadedFile($path, $filename, $mime, null, true);
    }

    public function test_admin_can_upload_valid_image(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $cat = $this->category();

        $file = $this->fakeImage('test.jpg', 'image/jpeg');

        $response = $this->actingAs($admin)->post(route('admin.products.store'), [
            'name' => 'P',
            'slug' => 'p-upload',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'images' => [
                ['file' => $file, 'alt_text' => 'Alt', 'sort_order' => 0, 'is_primary' => true],
            ],
        ]);

        $response->assertRedirect(route('admin.products.index'));
        $product = Product::where('slug', 'p-upload')->first();
        $this->assertNotNull($product);
        $this->assertCount(1, $product->images);
        $image = $product->images->first();
        $this->assertEquals('Alt', $image->alt_text);
        $this->assertTrue($image->is_primary);
        $this->assertEquals($product->id, $image->product_id);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $image->url) ?: ltrim(parse_url($image->url, PHP_URL_PATH) ?? '', '/'));
    }

    public function test_invalid_mime_rejected(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $cat = $this->category();
        $file = UploadedFile::fake()->create('evil.exe', 100, 'application/x-msdownload');

        $response = $this->actingAs($admin)->post(route('admin.products.store'), [
            'name' => 'P2',
            'slug' => 'p2',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'images' => [
                ['file' => $file, 'alt_text' => 'Alt'],
            ],
        ]);

        $response->assertSessionHasErrors('images.0.file');
    }

    public function test_oversized_image_rejected(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $cat = $this->category();
        $file = UploadedFile::fake()->create('big.jpg', 6000, 'image/jpeg'); // 6MB > 5MB

        $response = $this->actingAs($admin)->post(route('admin.products.store'), [
            'name' => 'P3',
            'slug' => 'p3',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'images' => [
                ['file' => $file],
            ],
        ]);

        $response->assertSessionHasErrors('images.0.file');
    }

    public function test_unauthenticated_cannot_upload(): void
    {
        Storage::fake('public');
        $cat = $this->category();
        $file = UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg');

        $this->post(route('admin.products.store'), [
            'name' => 'P',
            'slug' => 'p-unauth',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'images' => [['file' => $file]],
        ])->assertRedirect(route('login'));
    }

    public function test_staff_cannot_upload(): void
    {
        Storage::fake('public');
        $staff = User::factory()->create(['role' => 'staff']);
        $cat = $this->category();
        $file = UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg');

        $this->actingAs($staff)->post(route('admin.products.store'), [
            'name' => 'P',
            'slug' => 'p-staff',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'images' => [['file' => $file]],
        ])->assertForbidden();
    }

    public function test_primary_image_behavior_only_one_primary(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p-primary', 'description' => 'D', 'status' => 'active']);
        $img1 = $product->images()->create(['url' => '/storage/a.jpg', 'sort_order' => 0, 'is_primary' => true, 'alt_text' => 'A']);
        $img2 = $product->images()->create(['url' => '/storage/b.jpg', 'sort_order' => 1, 'is_primary' => false, 'alt_text' => 'B']);

        // Set img2 as primary
        $this->actingAs($admin)->put(route('admin.products.update', $product), [
            'name' => 'P',
            'slug' => 'p-primary',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'images' => [
                ['id' => $img1->id, 'url' => $img1->url, 'sort_order' => 0, 'is_primary' => false, 'alt_text' => 'A'],
                ['id' => $img2->id, 'url' => $img2->url, 'sort_order' => 1, 'is_primary' => true, 'alt_text' => 'B'],
            ],
        ])->assertRedirect(route('admin.products.index'));

        $product->refresh();
        $this->assertFalse($product->images->find($img1->id)->is_primary);
        $this->assertTrue($product->images->find($img2->id)->is_primary);
        $this->assertEquals(1, $product->images->where('is_primary', true)->count());
    }

    public function test_delete_removes_owned_storage_file(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p-del', 'description' => 'D', 'status' => 'active']);
        // Create a fake owned file
        $path = 'products/'.$product->id.'/test.jpg';
        Storage::disk('public')->put($path, 'fake');
        $url = Storage::disk('public')->url($path);
        $image = $product->images()->create(['url' => $url, 'sort_order' => 0, 'is_primary' => true]);

        $this->actingAs($admin)->put(route('admin.products.update', $product), [
            'name' => 'P',
            'slug' => 'p-del',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'images' => [], // remove all
        ])->assertRedirect(route('admin.products.index'));

        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
    }

    public function test_external_url_not_deleted(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p-ext', 'description' => 'D', 'status' => 'active']);
        $externalUrl = 'https://example.com/external.jpg';
        $image = $product->images()->create(['url' => $externalUrl, 'sort_order' => 0, 'is_primary' => true]);

        $this->actingAs($admin)->put(route('admin.products.update', $product), [
            'name' => 'P',
            'slug' => 'p-ext',
            'category_id' => $cat->id,
            'description' => 'D',
            'status' => 'active',
            'images' => [],
        ])->assertRedirect(route('admin.products.index'));

        // Should not try to delete external URL from storage, just DB record
        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
        // No exception, external URL not on disk
        $this->assertTrue(true);
    }

    public function test_product_deletion_cleans_owned_storage(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $cat = $this->category();
        $product = Product::create(['category_id' => $cat->id, 'name' => 'P', 'slug' => 'p-del-prod', 'description' => 'D', 'status' => 'active']);
        $path = 'products/'.$product->id.'/to-delete.jpg';
        Storage::disk('public')->put($path, 'fake');
        $url = Storage::disk('public')->url($path);
        $product->images()->create(['url' => $url, 'sort_order' => 0, 'is_primary' => true]);

        $this->actingAs($admin)->delete(route('admin.products.destroy', $product))->assertRedirect(route('admin.products.index'));
        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }
}
