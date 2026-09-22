#!/bin/sh
set -e

echo "Danob Trading PLC — Starting..."

# Ensure storage and cache directories exist and are writable
mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

echo "Clearing stale caches..."
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "Running migrations..."
php artisan migrate --force || (echo "MIGRATE FAILED — check DB_* / Supabase allowlist and APP_KEY" && php artisan migrate --force --verbose)

echo "Caching for production..."
php artisan config:cache || (echo "config:cache failed" && php artisan config:clear)
php artisan route:cache || true
php artisan view:cache || true

# Start FrankenPHP on the port Render provides
echo "Starting server on port ${PORT:-8000}..."
exec frankenphp php-server --listen 0.0.0.0:${PORT:-8000} --root public/
