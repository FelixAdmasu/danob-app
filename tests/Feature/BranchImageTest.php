<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BranchImageTest extends TestCase
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

    private function branchAttributes(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Kolfe Branch',
            'address' => 'Kolfe area',
            'city' => 'Addis Ababa',
            'is_active' => true,
        ], $overrides);
    }

    public function test_create_with_image_stores_file_and_root_relative_url(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $file = $this->fakeImage('branch.jpg', 'image/jpeg');

        $response = $this->actingAs($admin)->post(route('admin.branches.store'), [
            ...$this->branchAttributes(['name' => 'Branch With Image']),
            'image' => $file,
        ]);

        $response->assertRedirect(route('admin.branches.index'));

        $branch = Branch::where('name', 'Branch With Image')->first();
        $this->assertNotNull($branch);
        $this->assertNotNull($branch->image_url);
        $this->assertStringStartsWith('/storage/branches/'.$branch->id.'/', $branch->image_url);
        $this->assertStringNotContainsString('://', $branch->image_url);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $branch->image_url));
    }

    public function test_update_with_new_file_replaces_old_file(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $branch = Branch::create($this->branchAttributes(['name' => 'Old']));
        $oldPath = 'branches/'.$branch->id.'/old.jpg';
        Storage::disk('public')->put($oldPath, 'old');
        $branch->update(['image_url' => '/storage/'.$oldPath]);

        $file = $this->fakeImage('new.jpg', 'image/jpeg');
        $response = $this->actingAs($admin)->put(route('admin.branches.update', $branch), [
            ...$this->branchAttributes(['name' => 'Old']),
            'image' => $file,
        ]);

        $response->assertRedirect(route('admin.branches.index'));

        $branch->refresh();
        Storage::disk('public')->assertMissing($oldPath);
        $this->assertNotNull($branch->image_url);
        $this->assertNotEquals('/storage/'.$oldPath, $branch->image_url);
        $this->assertStringStartsWith('/storage/branches/'.$branch->id.'/', $branch->image_url);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $branch->image_url));
        // Exactly the replacement remains — no orphan files.
        $this->assertCount(1, Storage::disk('public')->files('branches/'.$branch->id));
    }

    public function test_remove_image_flag_deletes_file_and_nulls_column(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $branch = Branch::create($this->branchAttributes(['name' => 'Removable']));
        $path = 'branches/'.$branch->id.'/to-remove.jpg';
        Storage::disk('public')->put($path, 'fake');
        $branch->update(['image_url' => '/storage/'.$path]);

        $response = $this->actingAs($admin)->put(route('admin.branches.update', $branch), [
            ...$this->branchAttributes(['name' => 'Removable']),
            'remove_image' => true,
        ]);

        $response->assertRedirect(route('admin.branches.index'));

        $branch->refresh();
        $this->assertNull($branch->image_url);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_destroy_deletes_owned_file_with_the_row(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $branch = Branch::create($this->branchAttributes(['name' => 'Doomed']));
        $path = 'branches/'.$branch->id.'/to-delete.jpg';
        Storage::disk('public')->put($path, 'fake');
        $branch->update(['image_url' => '/storage/'.$path]);

        $this->actingAs($admin)
            ->delete(route('admin.branches.destroy', $branch))
            ->assertRedirect(route('admin.branches.index'));

        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('branches', ['id' => $branch->id]);
    }

    public function test_invalid_file_rejected(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $file = UploadedFile::fake()->create('evil.exe', 100, 'application/x-msdownload');

        $response = $this->actingAs($admin)->post(route('admin.branches.store'), [
            ...$this->branchAttributes(['name' => 'Bad File']),
            'image' => $file,
        ]);

        $response->assertSessionHasErrors('image');
        $this->assertDatabaseMissing('branches', ['name' => 'Bad File']);
    }

    public function test_create_without_image_still_works(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $response = $this->actingAs($admin)->post(route('admin.branches.store'), [
            ...$this->branchAttributes(['name' => 'No Image']),
        ]);

        $response->assertRedirect(route('admin.branches.index'));

        $branch = Branch::where('name', 'No Image')->first();
        $this->assertNotNull($branch);
        $this->assertNull($branch->image_url);
        $this->assertEmpty(Storage::disk('public')->files('branches/'.$branch->id));
    }
}
