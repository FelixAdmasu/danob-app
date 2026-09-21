# =============================================================================
# Danob Trading PLC — Production Dockerfile
# Multi-stage build: Node (frontend) → PHP (runtime with FrankenPHP)
# =============================================================================

# ---- Stage 1: Build frontend with Node ----
FROM node:20-bookworm-slim AS frontend

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json package-lock.json ./

# Install node dependencies
RUN npm ci --prefer-offline

# Install PHP CLI for Wayfinder type generation during Vite build
RUN apt-get update && apt-get install -y --no-install-recommends \
        php-cli php-xml php-mbstring php-curl php-zip php-tokenizer \
    && rm -rf /var/lib/apt/lists/*

# Copy application source needed for Vite build
COPY resources/ resources/
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY public/ public/

# Generate Wayfinder types and build production assets
# Wayfinder runs "php artisan wayfinder:generate" during Vite build
RUN npm run build


# ---- Stage 2: PHP runtime ----
FROM php:8.4-bookworm AS runtime

# Install system dependencies + PHP extensions required by Laravel
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libonig-dev \
        libxml2-dev \
        libzip-dev \
        libpq-dev \
        unzip \
        zip \
        cron \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        xml \
        zip \
        opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install FrankenPHP
COPY --from=dunglas/frankenphp:php8.4-bookworm /usr/local/bin/frankenphp /usr/local/bin/frankenphp
RUN mkdir -p /etc/frankenphp/caddy /etc/frankenphp/php.ini

# Set recommended PHP production settings
RUN echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/laravel.ini \
    && echo "upload_max_filesize = 64M" >> /usr/local/etc/php/conf.d/laravel.ini \
    && echo "post_max_size = 64M" >> /usr/local/etc/php/conf.d/laravel.ini \
    && echo "max_execution_time = 60" >> /usr/local/etc/php/conf.d/laravel.ini \
    && echo "opcache.enable = 1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.validate_timestamps = 0" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files = 20000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption = 256" >> /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /app

# Install composer dependencies (no dev)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
RUN composer dump-autoload --optimize --no-dev

# Copy application code
COPY . .

# Copy built frontend assets from Stage 1
COPY --from=frontend /app/public/build/ public/build/
COPY --from=frontend /app/vendor/ vendor/

# Ensure Wayfinder-generated types exist (copied from frontend build)
COPY --from=frontend /app/resources/js/routes/ resources/js/routes/ 2>/dev/null || true
COPY --from=frontend /app/resources/js/actions/ resources/js/actions/ 2>/dev/null || true
COPY --from=frontend /app/resources/js/wayfinder/ resources/js/wayfinder/ 2>/dev/null || true

# Set production environment defaults
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stack
ENV LOG_LEVEL=error

# Create required writable directories
RUN mkdir -p storage/framework/{sessions,views,cache} \
    storage/logs \
    storage/app/public \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
