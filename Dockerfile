# =============================================================================
# Danob Trading PLC — Production Dockerfile
# Multi-stage build: Node (frontend) → PHP (runtime with FrankenPHP)
# =============================================================================

# ---- Stage 1: Build frontend with Node ----
FROM node:20.20-bookworm AS frontend

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json package-lock.json ./

# Install node dependencies
RUN npm ci

# Install PHP 8.4+ CLI for Wayfinder type generation during Vite build
# Use pre-built PHP 8.4 from FrankenPHP image (avoids 106s Sury compile + timeout)
COPY --from=dunglas/frankenphp:php8.4-bookworm /usr/local/bin/php /usr/local/bin/php
COPY --from=dunglas/frankenphp:php8.4-bookworm /usr/local/lib/php /usr/local/lib/php
COPY --from=dunglas/frankenphp:php8.4-bookworm /usr/local/etc/php /usr/local/etc/php
ENV PATH="/usr/local/bin:${PATH}"

# Runtime libs for FrankenPHP PHP binary + unzip for composer
RUN apt-get update && apt-get install -y --no-install-recommends \
        unzip \
        libonig5 libpq5 libzip4 libxml2 libcurl4 libsqlite3-0 \
        libsodium23 libargon2-1 libicu72 libxslt1.1 libfreetype6 \
        libjpeg62-turbo libpng16-16 libssl3 zlib1g \
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

# --- DIAGNOSTICS before Vite build (temporary) ---
RUN echo "=== DIAGNOSTICS: Node / npm / PHP ===" && \
    node -v && npm -v && php -v && php -m && php artisan --version && \
    echo "=== Rolldown binding check ===" && \
    test -d node_modules/@rolldown/binding-linux-x64-gnu || (echo "ERROR: @rolldown/binding-linux-x64-gnu dir missing" && exit 1) && \
    test -f node_modules/@rolldown/binding-linux-x64-gnu/package.json || (echo "ERROR: binding package.json missing" && exit 1) && \
    node -e "console.log('binding version:', require('./node_modules/@rolldown/binding-linux-x64-gnu/package.json').version)"

# Create required Laravel cache directories for Wayfinder (Compiler.php needs storage/framework/*)
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

# --- Explicit Wayfinder generation (temporary diagnostic) ---
RUN echo "=== Wayfinder source check ===" && \
    test -f artisan || (echo "ERROR: artisan missing" && exit 1) && \
    test -d app || (echo "ERROR: app/ missing" && exit 1) && \
    test -d routes || (echo "ERROR: routes/ missing" && exit 1) && \
    test -d bootstrap || (echo "ERROR: bootstrap/ missing" && exit 1) && \
    test -d config || (echo "ERROR: config/ missing" && exit 1) && \
    test -d vendor || (echo "ERROR: vendor/ missing" && exit 1) && \
    echo "=== Laravel cache directories ready ===" && \
    test -d storage/framework/cache || (echo "ERROR: storage/framework/cache missing" && exit 1) && \
    test -d storage/framework/sessions || (echo "ERROR: storage/framework/sessions missing" && exit 1) && \
    test -d storage/framework/views || (echo "ERROR: storage/framework/views missing" && exit 1) && \
    test -d storage/logs || (echo "ERROR: storage/logs missing" && exit 1) && \
    test -d bootstrap/cache || (echo "ERROR: bootstrap/cache missing" && exit 1) && \
    find storage/framework -maxdepth 2 -type d -print && find bootstrap/cache -maxdepth 1 -type d -print && \
    echo "=== Running php artisan wayfinder:generate ===" && \
    php artisan wayfinder:generate && \
    echo "=== Wayfinder generation succeeded ===" && \
    test -d resources/js/routes || (echo "ERROR: resources/js/routes missing after wayfinder" && exit 1) && \
    test -d resources/js/actions || (echo "ERROR: resources/js/actions missing after wayfinder" && exit 1) && \
    test -d resources/js/wayfinder || (echo "ERROR: resources/js/wayfinder missing after wayfinder" && exit 1) && \
    ls -la resources/js/routes && ls -la resources/js/actions && ls -la resources/js/wayfinder

# Generate Wayfinder types and build production assets
# Wayfinder runs "php artisan wayfinder:generate" during Vite build
RUN npm run build


# ---- Stage 2: PHP runtime ----
FROM dunglas/frankenphp:php8.4-bookworm AS runtime

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

# Render runs on unprivileged port 10000 — strip CAP_NET_BIND_SERVICE to avoid EPERM (Operation not permitted)
RUN apt-get update && apt-get install -y --no-install-recommends libcap2-bin \
    && setcap -r /usr/local/bin/frankenphp \
    && rm -rf /var/lib/apt/lists/*
RUN ls -l /usr/local/bin/frankenphp \
    && getcap /usr/local/bin/frankenphp || true \
    && /usr/local/bin/frankenphp version
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

# Copy application code (artisan required for post-autoload-dump package:discover)
COPY . .
RUN composer dump-autoload --optimize --no-dev

# Copy built frontend assets from Stage 1
COPY --from=frontend /app/public/build/ public/build/
COPY --from=frontend /app/vendor/ vendor/

# Ensure Wayfinder-generated types exist (copied from frontend build)
COPY --from=frontend /app/resources/js/routes/ resources/js/routes/
COPY --from=frontend /app/resources/js/actions/ resources/js/actions/
COPY --from=frontend /app/resources/js/wayfinder/ resources/js/wayfinder/

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
