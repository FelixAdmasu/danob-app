#!/bin/sh
set -e

echo "Danob Trading PLC — Starting..."

# Storage safety net: Render's container disk is wiped on every deploy, so
# product images MUST live on Supabase Storage. Warn loudly if misconfigured
# (silent loss on the next push is exactly the bug we fixed — docs/storage.md).
if [ "${APP_ENV:-}" = "production" ] && [ "${FILESYSTEM_DISK_PRODUCT_IMAGES:-public}" != "supabase" ]; then
    echo "WARN: FILESYSTEM_DISK_PRODUCT_IMAGES is '${FILESYSTEM_DISK_PRODUCT_IMAGES:-public}' — uploaded images will be LOST on the next deploy. Set it to 'supabase' (docs/storage.md)."
fi
if [ "${FILESYSTEM_DISK_PRODUCT_IMAGES:-public}" = "supabase" ]; then
    if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ACCESS_KEY_ID:-}" ] || [ -z "${SUPABASE_SECRET_ACCESS_KEY:-}" ]; then
        echo "WARN: Supabase image storage selected but SUPABASE_URL / SUPABASE_ACCESS_KEY_ID / SUPABASE_SECRET_ACCESS_KEY is incomplete — uploads will fail (docs/storage.md)."
    fi
fi

# Ensure storage and cache directories exist and are writable
mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

echo "Clearing stale caches..."
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "Ensuring storage symlink exists (serves /storage/* image uploads)..."
php artisan storage:link --force || echo "WARN: storage:link failed — uploaded images will not be served"

echo "Running migrations..."
php artisan migrate --force || (echo "MIGRATE FAILED — check DB_* / Supabase allowlist and APP_KEY" && php artisan migrate --force --verbose)

echo "DB LIVE CHECK (free-tier Shell alternative):"
php artisan tinker --execute "echo 'DB=' . config('database.connections.pgsql.host') . ':' . config('database.connections.pgsql.database') . ' cat_total='.App\Models\Category::count().' cat_active='.App\Models\Category::where('is_active',true)->count().' prod_total='.App\Models\Product::count().' prod_active='.App\Models\Product::where('status','active')->count().' cat_products_sum='.App\Models\Category::where('is_active',true)->withCount('products')->get()->sum('products_count');" || true

echo "Caching for production..."
php artisan config:cache || (echo "config:cache failed" && php artisan config:clear)
php artisan route:cache || true
php artisan view:cache || true

# Start FrankenPHP on the port Render provides
echo "Starting server on port ${PORT:-8000}..."
exec frankenphp php-server --listen 0.0.0.0:${PORT:-8000} --root public/
