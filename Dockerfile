# =============================================================================
# Danob Trading PLC — Production Dockerfile
# Multi-stage build: Node (frontend) → PHP (runtime with FrankenPHP)
# =============================================================================

# ---- Stage 1: Build frontend with Node ----
FROM node:20-bookworm AS frontend

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json package-lock.json ./

# Install node dependencies
RUN npm ci

# Install PHP 8.4+ CLI for Wayfinder type generation during Vite build
# Debian Bookworm ships PHP 8.2; Sury repo provides PHP 8.4+ (required by Laravel 13 / Symfony)
RUN apt-get update && apt-get install -y --no-install-recommends \
        apt-transport-https ca-certificates curl gnupg unzip \
    && curl -sSL https://packages.sury.org/php/apt.gpg \
        | gpg --dearmor -o /usr/share/keyrings/deb.sury.org-php.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ bookworm main" \
        > /etc/apt/sources.list.d/sury-php.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        php8.4-cli php8.4-xml php8.4-mbstring php8.4-curl php8.4-zip php8.4-tokenizer \
    && rm -rf /var/lib/apt/lists/*

# Install Composer (needed to bootstrap Laravel for Wayfinder)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy Laravel files required by "php artisan wayfinder:generate"
COPY artisan ./
COPY app/ app/
COPY routes/ routes/
COPY bootstrap/ bootstrap/
COPY config/ config/
COPY composer.json composer.lock ./

# Install Composer dependencies (no-dev, no-scripts, no-autoloader)
# Wayfinder needs a bootable Laravel app but does NOT need dev packages or scripts
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist
RUN composer dump-autoload --optimize --no-dev

# Environment for Wayfinder build — Laravel requires APP_KEY to boot.
# This is a throwaway key; the runtime stage uses the real APP_KEY from Render env vars.
ENV APP_KEY=base64:xWx5K4rQ8eJ3mNp1vB7hD2fG6aL0sT4uY9cR5iO3kE=
ENV APP_ENV=local
ENV APP_DEBUG=true
ENV DB_CONNECTION=sqlite
ENV DB_DATABASE=:memory:

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
