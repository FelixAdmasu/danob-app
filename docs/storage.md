# Product Images Storage

## Why Supabase Storage in production

Render's container filesystem is **ephemeral**: every push to `main` triggers a
redeploy that replaces the container, wiping `storage/app/public`. Image *rows*
live in Postgres (Supabase) and survive, but files written to the local disk do
not. The classic symptom is "product images 404 after every deploy" — it
happened here because `FILESYSTEM_DISK_PRODUCT_IMAGES` was never set in
`render.yaml`, so uploads silently landed on the container disk.

Rule: **anything durable must not live on the container disk.**

## Architecture

- **Local dev:** `FILESYSTEM_DISK_PRODUCT_IMAGES=public` → `storage/app/public/products` via the `public` disk (`Storage::fake('public')` in tests)
- **Production:** `FILESYSTEM_DISK_PRODUCT_IMAGES=supabase` → Supabase Storage, bucket `product-images`

Uploaded path: `products/{product_id}/{random}.{ext}` via
`$file->store('products/'.$id, $disk)`. URLs are persisted **absolutely** for
Supabase (`https://<project-ref>.supabase.co/storage/v1/object/public/product-images/...`)
and **root-relative** for the local disk (`/storage/products/...`).

Uploads fail with a validation error (and persist no `product_images` row) if
storage rejects the write — a failed upload must never look successful.

Profile photos share this disk and this guard: they are stored under the
`avatars/` prefix on the same configured disk (`/storage/avatars/...` locally,
`product-images/avatars/...` on Supabase), so one durable location holds every
uploaded file.

In **production** an extra guard refuses any upload whose target disk has the
`local` driver: a local write would land on Render's ephemeral container disk
and 404 on the next deploy, so it is rejected up front with
`FILESYSTEM_DISK_PRODUCT_IMAGES must be 'supabase'` (see the `storeImageOrFail`
helpers in `ProductController` and `HandlesImageStorage`). Local dev and tests
are unaffected.

## Render environment (`render.yaml`)

Set by the blueprint (non-secret):

```yaml
FILESYSTEM_DISK_PRODUCT_IMAGES: supabase
SUPABASE_BUCKET: product-images
SUPABASE_DEFAULT_REGION: us-east-1
SUPABASE_USE_PATH_STYLE_ENDPOINT: "true"
```

Must be set on the Render dashboard (declared `sync: false`):

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ACCESS_KEY_ID=<S3 access key>
SUPABASE_SECRET_ACCESS_KEY=<S3 secret key>
```

`SUPABASE_ENDPOINT` is derived from `SUPABASE_URL`
(`https://<project-ref>.storage.supabase.co/storage/v1/s3`) unless set
explicitly. If the service is **not** blueprint-managed, also add the four
value vars above manually.

Never expose `SUPABASE_ACCESS_KEY_ID` / `SUPABASE_SECRET_ACCESS_KEY` to
Vite/React — they are server-side only.

The container entrypoint prints a loud warning at boot when `APP_ENV=production`
but the product-image disk is not `supabase`, or when the `SUPABASE_URL`/key
pair is incomplete.

## Supabase setup (one-time)

1. Supabase Dashboard → your project → **Storage → New bucket** → name
   `product-images` → enable **Public bucket** → Save.
   (No code auto-creates the bucket; a private bucket makes every image URL 403.)
2. **Project Settings → Storage → S3-compatible API keys** → create/copy the
   access key + secret key.
3. **Project Settings → API** → copy the **Project URL**.
4. Paste the three values into Render → **Environment** → Save
   (Render redeploys automatically).

### Verify

Upload a product image and open it: the URL must be
`https://<project-ref>.supabase.co/storage/v1/object/public/product-images/products/...`.
Then push/deploy again — the image must still load.

## Migrating away from the wiped container disk

Rows created before this fix point at `/storage/products/...` files that no
longer exist — the containers that held them are gone, so **the files are not
recoverable** from the server. Re-upload those images (the original uploads
are still in the local Downloads folder). To drop the dead rows in bulk
(Supabase SQL editor, only after confirming the files 404):

```sql
delete from product_images where url like '%/storage/products/%';
```

## Local

```bash
php artisan storage:link
```

`FILESYSTEM_DISK_PRODUCT_IMAGES` defaults to `public`; `.env.example` documents
the full Supabase variable set.
