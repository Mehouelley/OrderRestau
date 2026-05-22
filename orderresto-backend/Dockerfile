FROM php:8.3-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql gd zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

# Ensure required writable directories exist before running Composer (artisan package:discover requires them)
RUN mkdir -p bootstrap/cache \
    storage/framework/{sessions,views,cache} \
    storage/app && \
    chmod -R 0777 bootstrap/cache storage || true

RUN composer install --no-dev --optimize-autoloader

RUN php artisan key:generate --force || true
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD sh -c "php artisan serve --host 0.0.0.0 --port ${PORT:-10000}"
