#!/bin/sh
set -e

echo "Danob Trading PLC — Starting..."

# Ensure storage and cache directories exist and are writable
mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Clear and cache configuration for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start FrankenPHP on the port Render provides
echo "Starting server on port ${PORT:-8000}..."
exec frankenphp php-server --listen 0.0.0.0:${PORT:-8000} --root public/
