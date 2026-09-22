<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class OptimizeProductImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $disk, public string $path) {}

    public function handle(): void
    {
        if (! extension_loaded('gd') && ! extension_loaded('imagick')) {
            return;
        }

        if (! Storage::disk($this->disk)->exists($this->path)) {
            return;
        }

        try {
            $tmp = tempnam(sys_get_temp_dir(), 'opt');
            $content = Storage::disk($this->disk)->get($this->path);
            file_put_contents($tmp, $content);

            $manager = new ImageManager(new Driver);
            $image = $manager->read($tmp);
            $image->scaleDown(width: 1200);
            $encoded = $image->encodeByExtension(pathinfo($this->path, PATHINFO_EXTENSION) ?: 'jpg', quality: 80);
            Storage::disk($this->disk)->put($this->path, (string) $encoded);
            @unlink($tmp);
        } catch (\Throwable $e) {
            // fail silently, keep original
            if (isset($tmp) && file_exists($tmp)) {
                @unlink($tmp);
            }
        }
    }
}
