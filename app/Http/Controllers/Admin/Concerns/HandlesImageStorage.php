<?php

namespace App\Http\Controllers\Admin\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Shared storage helpers for uploaded catalog images. Category and Brand
 * controllers use this trait; ProductController keeps an identical private
 * copy of these helpers — keep the two in sync. One behavior for storing,
 * resolving and deleting files across the local `public` disk and the
 * Supabase/s3 disk.
 */
trait HandlesImageStorage
{
    /**
     * Public URL for an uploaded image.
     *
     * Local disks are served through the /storage symlink, so persist a
     * root-relative URL: it keeps working no matter which host, port or
     * APP_URL the app is served from (dev server ports, deploy domains).
     * Cloud disks (s3/supabase) keep their absolute public URL.
     */
    private function storageUrl(string $disk, string $path): string
    {
        $url = Storage::disk($disk)->url($path);

        if (config("filesystems.disks.{$disk}.driver") !== 'local') {
            return $url;
        }

        $relative = parse_url($url, PHP_URL_PATH);

        return is_string($relative) && $relative !== '' ? $relative : $url;
    }

    /**
     * Persist an uploaded image or fail the whole request with a field error.
     *
     * Storage can reject a write (missing bucket, bad keys, unwritable disk).
     * We must never persist a row pointing at a file that was not saved —
     * a silent false here is how "uploaded" images vanish on the next deploy.
     *
     * @param  string  $field  Validation key to attribute the error to (e.g. "images.0.file" or "image").
     */
    private function storeImageOrFail(UploadedFile $file, string $directory, string $disk, string $field): string
    {
        // Fail fast in production: writing to a local disk means the container's
        // ephemeral filesystem, which is wiped on every deploy — images would 404
        // after the next redeploy. Only cloud disks (supabase/s3) are durable.
        if (config('app.env') === 'production' && config("filesystems.disks.{$disk}.driver") === 'local') {
            report(new \RuntimeException(
                "Blocked product image upload to local disk '{$disk}' in production — storage is misconfigured (FILESYSTEM_DISK_PRODUCT_IMAGES must be 'supabase')."
            ));

            throw ValidationException::withMessages([
                $field => 'Image storage is not configured for production uploads. Set FILESYSTEM_DISK_PRODUCT_IMAGES=supabase (see docs/storage.md).',
            ]);
        }

        try {
            $path = $file->store($directory, $disk);
        } catch (\Throwable $e) {
            report($e);
            $path = false;
        }

        if (! is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                $field => 'Image upload failed — the file could not be saved to storage. Please try again.',
            ]);
        }

        return $path;
    }

    private function isOwnedStorageUrl(string $url): bool
    {
        // Owned if it's a storage path for product-images disk (local /storage/ or supabase bucket)
        // External URLs (https://example.com/...) are not owned.
        // A hostless url resolves against this app's origin, so /storage/... is ours.
        $path = parse_url($url, PHP_URL_PATH);
        if (is_string($path) && str_starts_with($path, '/storage/') && parse_url($url, PHP_URL_HOST) === null) {
            return true;
        }
        if (str_starts_with($url, '/storage/product-images/')) {
            return true;
        }
        if (str_contains($url, '/storage/v1/object/public/'.config('filesystems.disks.supabase.bucket', 'product-images'))) {
            return true;
        }
        // Check if url is from our configured disks
        $disk = config('filesystems.product_images_disk', 'public');
        try {
            $diskUrl = Storage::disk($disk)->url('');
            if ($diskUrl && str_starts_with($url, $diskUrl)) {
                return true;
            }
        } catch (\Throwable $e) {
            // ignore
        }
        // Also check supabase disk
        try {
            $supabaseUrl = Storage::disk('supabase')->url('');
            if ($supabaseUrl && str_starts_with($url, $supabaseUrl)) {
                return true;
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return false;
    }

    private function deleteOwnedFile(string $url): void
    {
        // Derive storage path from url and delete from appropriate disk
        $disks = [config('filesystems.product_images_disk', 'public'), 'supabase', 'public', 's3'];
        $disks = array_unique(array_filter($disks));

        foreach ($disks as $disk) {
            try {
                $diskUrl = Storage::disk($disk)->url('');
                if ($diskUrl && str_starts_with($url, $diskUrl)) {
                    $path = ltrim(Str::after($url, $diskUrl), '/');
                    if ($path && Storage::disk($disk)->exists($path)) {
                        Storage::disk($disk)->delete($path);

                        return;
                    }
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        // Fallback for local /storage/... paths
        if (str_starts_with($url, '/storage/')) {
            $path = ltrim(Str::after($url, '/storage/'), '/');
            // For local public disk, product-images is under product-images/
            if (str_starts_with($path, 'product-images/')) {
                $actualPath = Str::after($path, 'product-images/');
                if (Storage::disk('product-images')->exists($actualPath) || Storage::disk('public')->exists($actualPath) || Storage::disk('public')->exists('product-images/'.$actualPath)) {
                    Storage::disk('product-images')->delete($actualPath);
                    Storage::disk('public')->delete($actualPath);
                    Storage::disk('public')->delete('product-images/'.$actualPath);
                }
            } else {
                Storage::disk('public')->delete($path);
            }
        }
    }
}
