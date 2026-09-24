<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProfileAvatarTest extends TestCase
{
    use RefreshDatabase;

    private function fakeImage(string $filename = 'avatar.jpg', string $mime = 'image/jpeg'): UploadedFile
    {
        // 1x1 pixel image without requiring GD (same helper as ProductImageUploadTest).
        $tmp = tempnam(sys_get_temp_dir(), 'img');
        file_put_contents($tmp, base64_decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQABADAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='));

        $path = $tmp.'.'.pathinfo($filename, PATHINFO_EXTENSION);
        rename($tmp, $path);

        return new UploadedFile($path, $filename, $mime, null, true);
    }

    public function test_profile_photo_can_be_uploaded(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user)->put(route('profile.avatar.update'), [
            'avatar' => $this->fakeImage(),
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();

        $this->assertNotNull($user->avatar);
        $this->assertStringStartsWith('/storage/avatars/', $user->avatar);
        Storage::disk('public')->assertExists(Str::after($user->avatar, '/storage/'));
    }

    public function test_profile_photo_can_be_removed(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('avatars/existing.jpg', 'fake-bytes');

        $user = User::factory()->create();
        $user->avatar = '/storage/avatars/existing.jpg';
        $user->save();

        $response = $this->actingAs($user)->put(route('profile.avatar.update'), [
            'remove_avatar' => 1,
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $this->assertNull($user->refresh()->avatar);
        Storage::disk('public')->assertMissing('avatars/existing.jpg');
    }

    public function test_uploading_a_new_photo_replaces_and_deletes_the_old_file(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('avatars/old.jpg', 'old-bytes');

        $user = User::factory()->create();
        $user->avatar = '/storage/avatars/old.jpg';
        $user->save();

        $response = $this->actingAs($user)->put(route('profile.avatar.update'), [
            'avatar' => $this->fakeImage('new.jpg'),
        ]);

        $response->assertSessionHasNoErrors();

        $user->refresh();

        $this->assertNotNull($user->avatar);
        $this->assertNotSame('/storage/avatars/old.jpg', $user->avatar);
        Storage::disk('public')->assertMissing('avatars/old.jpg');
        Storage::disk('public')->assertExists(Str::after($user->avatar, '/storage/'));
    }

    public function test_non_image_files_are_rejected(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('notes.txt', 10, 'text/plain');

        $response = $this->actingAs($user)->put(route('profile.avatar.update'), [
            'avatar' => $file,
        ]);

        $response->assertSessionHasErrors('avatar');
        $this->assertNull($user->refresh()->avatar);
        Storage::disk('public')->assertEmpty();
    }

    public function test_an_empty_submission_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->put(route('profile.avatar.update'), []);

        $response->assertSessionHasErrors('avatar');
        $this->assertNull($user->refresh()->avatar);
    }

    public function test_production_blocks_local_disk_profile_photo_uploads(): void
    {
        // Same guard as catalog images: Render's container disk is wiped on
        // every deploy, so a local write in production must fail loudly
        // instead of storing a photo that would 404 after the next redeploy.
        Storage::fake('public');
        config(['app.env' => 'production', 'filesystems.product_images_disk' => 'public']);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->put(route('profile.avatar.update'), [
            'avatar' => $this->fakeImage(),
        ]);

        $response->assertSessionHasErrors('avatar');
        $this->assertNull($user->refresh()->avatar);
        Storage::disk('public')->assertEmpty();
    }

    public function test_production_allows_supabase_disk_profile_photo_uploads(): void
    {
        $base = 'https://abcdefghijkl.supabase.co/storage/v1/object/public/product-images';
        Storage::fake('public');
        Storage::fake('supabase', ['url' => $base]);
        config([
            'app.env' => 'production',
            'filesystems.product_images_disk' => 'supabase',
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->put(route('profile.avatar.update'), [
            'avatar' => $this->fakeImage(),
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();

        $this->assertNotNull($user->avatar);
        $this->assertStringStartsWith($base.'/avatars/', $user->avatar);
        Storage::disk('public')->assertEmpty();
    }
}
