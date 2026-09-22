# Product Images Storage

## Architecture

- **Local dev:** `FILESYSTEM_DISK_PRODUCT_IMAGES=public` → `storage/app/public/product-images` via `public` disk (`Storage::fake('public')` in tests)
- **Production:** `FILESYSTEM_DISK_PRODUCT_IMAGES=supabase` → Supabase Storage S3-compatible bucket `product-images`

## Supabase S3 Configuration

Laravel `config/filesystems.php` `supabase` disk:

```php
'supabase' => [
  'driver' => 's3',
  'key' => env('SUPABASE_ACCESS_KEY_ID'),
  'secret' => env('SUPABASE_SECRET_ACCESS_KEY'),
  'region' => env('SUPABASE_DEFAULT_REGION', 'us-east-1'),
  'bucket' => env('SUPABASE_BUCKET', 'product-images'),
  'endpoint' => env('SUPABASE_ENDPOINT', 'https://your-project.storage.supabase.co/storage/v1/s3'),
  'use_path_style_endpoint' => env('SUPABASE_USE_PATH_STYLE_ENDPOINT', true),
  'visibility' => 'public',
]
```

## Env (Render / Production)

Set on Render dashboard:

```
FILESYSTEM_DISK_PRODUCT_IMAGES=supabase
SUPABASE_BUCKET=product-images
SUPABASE_ACCESS_KEY_ID=<from Supabase Storage S3 keys>
SUPABASE_SECRET_ACCESS_KEY=<from Supabase Storage S3 keys>
SUPABASE_ENDPOINT=https://<project-ref>.storage.supabase.co/storage/v1/s3
SUPABASE_DEFAULT_REGION=us-east-1
SUPABASE_USE_PATH_STYLE_ENDPOINT=true
SUPABASE_URL=https://<project-ref>.supabase.co
```

Never expose `SUPABASE_ACCESS_KEY_ID` / `SECRET` to Vite/React.

## Bucket Setup

1. Supabase Dashboard → Storage → Create bucket `product-images` (public)
2. Policy: allow public read `storage.objects` where `bucket_id = 'product-images'`
3. No code auto-creates bucket.

## Local

```bash
php artisan storage:link
```

Uploaded files: `products/{product_id}/{uuid}.{ext}` via `$file->store('products/'.$product->id, $disk)`.
