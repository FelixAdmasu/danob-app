<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BrandImageTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function fakeImage(string $filename = 'logo.jpg', string $mime = 'image/jpeg'): UploadedFile
    {
        // 1x1 pixel images without requiring GD (same approach as ProductImageUploadTest)
        $map = [
            'image/jpeg' => '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQABADAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
            'image/png' => 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
            'image/webp' => 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        ];
        $base64 = $map[$mime] ?? $map['image/jpeg'];
        $tmp = tempnam(sys_get_temp_dir(), 'img');
        file_put_contents($tmp, base64_decode($base64));
        $path = $tmp.'.'.pathinfo($filename, PATHINFO_EXTENSION);
        rename($tmp, $path);

        return new UploadedFile($path, $filename, $mime, null, true);
    }

    public function test_create_with_file_stores_logo_under_brand_directory(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $response = $this->actingAs($admin)->post(route('admin.brands.store'), [
            'name' => 'Acme',
            'slug' => 'acme-upload',
            'description' => 'Desc',
            'is_active' => true,
            'logo' => $this->fakeImage('logo.jpg', 'image/jpeg'),
        ]);

        $response->assertRedirect(route('admin.brands.index'));
        $brand = Brand::where('slug', 'acme-upload')->first();
        $this->assertNotNull($brand);
        $this->assertNotNull($brand->logo_url);
        $this->assertStringStartsWith('/storage/brands/'.$brand->id.'/', $brand->logo_url);

        $path = str_replace('/storage/', '', $brand->logo_url);
        $this->assertStringStartsWith('brands/'.$brand->id.'/', $path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_update_with_new_file_replaces_logo_and_deletes_old_file(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $brand = Brand::create(['name' => 'Acme', 'slug' => 'acme-replace', 'is_active' => true]);
        $oldPath = 'brands/'.$brand->id.'/old.jpg';
        Storage::disk('public')->put($oldPath, 'old');
        $oldUrl = '/storage/'.$oldPath;
        $brand->logo_url = $oldUrl;
        $brand->save();

        $response = $this->actingAs($admin)->put(route('admin.brands.update', $brand), [
            'name' => 'Acme',
            'slug' => 'acme-replace',
            'is_active' => true,
            'logo' => $this->fakeImage('new.jpg', 'image/jpeg'),
        ]);

        $response->assertRedirect(route('admin.brands.index'));
        $brand->refresh();
        $this->assertNotNull($brand->logo_url);
        $this->assertNotSame($oldUrl, $brand->logo_url);
        $this->assertStringStartsWith('/storage/brands/'.$brand->id.'/', $brand->logo_url);

        Storage::disk('public')->assertMissing($oldPath);
        $newPath = str_replace('/storage/', '', $brand->logo_url);
        Storage::disk('public')->assertExists($newPath);
    }

    public function test_remove_logo_nulls_column_and_deletes_file(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $brand = Brand::create(['name' => 'Acme', 'slug' => 'acme-remove', 'is_active' => true]);
        $path = 'brands/'.$brand->id.'/logo.jpg';
        Storage::disk('public')->put($path, 'logo');
        $brand->logo_url = '/storage/'.$path;
        $brand->save();

        $response = $this->actingAs($admin)->put(route('admin.brands.update', $brand), [
            'name' => 'Acme',
            'slug' => 'acme-remove',
            'is_active' => true,
            'remove_logo' => true,
        ]);

        $response->assertRedirect(route('admin.brands.index'));
        $brand->refresh();
        $this->assertNull($brand->logo_url);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_plain_logo_url_string_still_accepted_on_create(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $response = $this->actingAs($admin)->post(route('admin.brands.store'), [
            'name' => 'Plain',
            'slug' => 'plain-url',
            'is_active' => true,
            'logo_url' => 'https://example.com/brand.png',
        ]);

        $response->assertRedirect(route('admin.brands.index'));
        $this->assertDatabaseHas('brands', [
            'slug' => 'plain-url',
            'logo_url' => 'https://example.com/brand.png',
        ]);
    }

    public function test_destroy_deletes_logo_file_with_row(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $brand = Brand::create(['name' => 'Doomed', 'slug' => 'doomed-brand', 'is_active' => true]);
        $path = 'brands/'.$brand->id.'/logo.jpg';
        Storage::disk('public')->put($path, 'logo');
        $brand->logo_url = '/storage/'.$path;
        $brand->save();

        $response = $this->actingAs($admin)->delete(route('admin.brands.destroy', $brand));

        $response->assertRedirect(route('admin.brands.index'));
        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
    }

    public function test_invalid_file_rejected(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $file = UploadedFile::fake()->create('evil.exe', 100, 'application/x-msdownload');

        $response = $this->actingAs($admin)->post(route('admin.brands.store'), [
            'name' => 'Evil',
            'slug' => 'evil-brand',
            'is_active' => true,
            'logo' => $file,
        ]);

        $response->assertSessionHasErrors('logo');
        $this->assertDatabaseMissing('brands', ['slug' => 'evil-brand']);
    }

    public function test_storage_failure_on_create_returns_validation_error_and_saves_nothing(): void
    {
        // When storage rejects a write the request must fail loudly and persist
        // no row — a brand pointing at a file that was never saved is worse
        // than no brand at all. Mirrors ProductImageUploadTest's broken-disk setup.
        config([
            'filesystems.product_images_disk' => 'broken',
            'filesystems.disks.broken' => [
                'driver' => 'local',
                // A file as the disk root: the directory can never be created,
                // so every write fails deterministically on any platform.
                'root' => __FILE__.DIRECTORY_SEPARATOR.'not-a-directory',
                'throw' => false,
                'report' => false,
            ],
        ]);

        $admin = $this->admin();
        $file = $this->fakeImage('logo.jpg', 'image/jpeg');

        $response = $this->actingAs($admin)->post(route('admin.brands.store'), [
            'name' => 'Broken',
            'slug' => 'broken-brand',
            'is_active' => true,
            'logo' => $file,
        ]);

        $response->assertSessionHasErrors('logo');
        $this->assertDatabaseMissing('brands', ['slug' => 'broken-brand']);
    }

    public function test_storage_failure_on_update_leaves_row_and_old_file_unchanged(): void
    {
        Storage::fake('public');
        config([
            'filesystems.product_images_disk' => 'broken',
            'filesystems.disks.broken' => [
                'driver' => 'local',
                'root' => __FILE__.DIRECTORY_SEPARATOR.'not-a-directory',
                'throw' => false,
                'report' => false,
            ],
        ]);

        $admin = $this->admin();
        $brand = Brand::create(['name' => 'Acme', 'slug' => 'broken-update', 'is_active' => true]);
        $oldPath = 'brands/'.$brand->id.'/old.jpg';
        Storage::disk('public')->put($oldPath, 'old');
        $oldUrl = '/storage/'.$oldPath;
        $brand->logo_url = $oldUrl;
        $brand->save();

        $response = $this->actingAs($admin)->put(route('admin.brands.update', $brand), [
            'name' => 'Acme',
            'slug' => 'broken-update',
            'is_active' => true,
            'logo' => $this->fakeImage('new.jpg', 'image/jpeg'),
        ]);

        $response->assertSessionHasErrors('logo');
        $brand->refresh();
        $this->assertSame($oldUrl, $brand->logo_url);
        Storage::disk('public')->assertExists($oldPath);
    }

    public function test_external_logo_url_not_deleted_on_remove(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $brand = Brand::create([
            'name' => 'External',
            'slug' => 'external-logo',
            'is_active' => true,
            'logo_url' => 'https://example.com/logo.png',
        ]);

        $response = $this->actingAs($admin)->put(route('admin.brands.update', $brand), [
            'name' => 'External',
            'slug' => 'external-logo',
            'is_active' => true,
            'remove_logo' => true,
        ]);

        $response->assertRedirect(route('admin.brands.index'));
        $brand->refresh();
        $this->assertNull($brand->logo_url);
        // No exception thrown: external URLs are never touched on disk.
    }
}
