<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CategoryImageTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
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
        $path = $tmp.'.'.pathinfo($filename, PATHINFO_EXTENSION);
        rename($tmp, $path);

        return new UploadedFile($path, $filename, $mime, null, true);
    }

    public function test_create_with_image_stores_file_and_root_relative_url(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $file = $this->fakeImage('cat.jpg', 'image/jpeg');

        $response = $this->actingAs($admin)->post(route('admin.categories.store'), [
            'name' => 'Cat With Image',
            'slug' => 'cat-with-image',
            'description' => 'Desc',
            'is_active' => true,
            'image' => $file,
        ]);

        $response->assertRedirect(route('admin.categories.index'));

        $category = Category::where('slug', 'cat-with-image')->first();
        $this->assertNotNull($category);
        $this->assertNotNull($category->image_url);
        $this->assertStringStartsWith('/storage/categories/'.$category->id.'/', $category->image_url);
        $this->assertStringNotContainsString('://', $category->image_url);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $category->image_url));
    }

    public function test_update_with_new_file_replaces_old_file(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $category = Category::create(['name' => 'Old', 'slug' => 'old-img', 'is_active' => true]);
        $oldPath = 'categories/'.$category->id.'/old.jpg';
        Storage::disk('public')->put($oldPath, 'old');
        $category->update(['image_url' => '/storage/'.$oldPath]);

        $file = $this->fakeImage('new.jpg', 'image/jpeg');
        $response = $this->actingAs($admin)->put(route('admin.categories.update', $category), [
            'name' => 'Old',
            'slug' => 'old-img',
            'is_active' => true,
            'image' => $file,
        ]);

        $response->assertRedirect(route('admin.categories.index'));

        $category->refresh();
        Storage::disk('public')->assertMissing($oldPath);
        $this->assertNotNull($category->image_url);
        $this->assertNotEquals('/storage/'.$oldPath, $category->image_url);
        $this->assertStringStartsWith('/storage/categories/'.$category->id.'/', $category->image_url);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $category->image_url));
        // Exactly the replacement remains — no orphan files.
        $this->assertCount(1, Storage::disk('public')->files('categories/'.$category->id));
    }

    public function test_remove_image_flag_deletes_file_and_nulls_column(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $category = Category::create(['name' => 'Removable', 'slug' => 'removable', 'is_active' => true]);
        $path = 'categories/'.$category->id.'/to-remove.jpg';
        Storage::disk('public')->put($path, 'fake');
        $category->update(['image_url' => '/storage/'.$path]);

        $response = $this->actingAs($admin)->put(route('admin.categories.update', $category), [
            'name' => 'Removable',
            'slug' => 'removable',
            'is_active' => true,
            'remove_image' => true,
        ]);

        $response->assertRedirect(route('admin.categories.index'));

        $category->refresh();
        $this->assertNull($category->image_url);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_destroy_deletes_owned_file_with_the_row(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $category = Category::create(['name' => 'Doomed', 'slug' => 'doomed', 'is_active' => true]);
        $path = 'categories/'.$category->id.'/to-delete.jpg';
        Storage::disk('public')->put($path, 'fake');
        $category->update(['image_url' => '/storage/'.$path]);

        $this->actingAs($admin)
            ->delete(route('admin.categories.destroy', $category))
            ->assertRedirect(route('admin.categories.index'));

        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_invalid_file_rejected(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $file = UploadedFile::fake()->create('evil.exe', 100, 'application/x-msdownload');

        $response = $this->actingAs($admin)->post(route('admin.categories.store'), [
            'name' => 'Bad File',
            'slug' => 'bad-file',
            'is_active' => true,
            'image' => $file,
        ]);

        $response->assertSessionHasErrors('image');
        $this->assertDatabaseMissing('categories', ['slug' => 'bad-file']);
    }

    public function test_create_without_image_still_works(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $response = $this->actingAs($admin)->post(route('admin.categories.store'), [
            'name' => 'No Image',
            'slug' => 'no-image',
            'description' => 'Desc',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('admin.categories.index'));

        $category = Category::where('slug', 'no-image')->first();
        $this->assertNotNull($category);
        $this->assertNull($category->image_url);
        $this->assertEmpty(Storage::disk('public')->files('categories/'.$category->id));
    }
}
