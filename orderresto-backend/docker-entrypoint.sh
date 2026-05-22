#!/bin/sh
set -e

# Ensure writable directories exist
mkdir -p bootstrap/cache \
  storage/framework/sessions \
  storage/framework/views \
  storage/framework/cache \
  storage/app

# Try to set ownership to www-data if the user exists, otherwise skip
if id www-data >/dev/null 2>&1; then
  chown -R www-data:www-data storage bootstrap/cache || true
fi

chmod -R 0777 storage bootstrap/cache || true

# Ensure VIEW_COMPILED_PATH exists if provided
if [ -n "$VIEW_COMPILED_PATH" ]; then
  mkdir -p "$VIEW_COMPILED_PATH"
  chmod -R 0777 "$VIEW_COMPILED_PATH" || true
fi

# AUTO-CONFIGURE APP_URL and FRONTEND_URL for production
if [ -z "$APP_URL" ]; then
  export APP_URL="https://orderresto-backend.onrender.com"
fi

if [ -z "$FRONTEND_URL" ]; then
  export FRONTEND_URL="https://order-restau.vercel.app"
fi

# If DB is configured, ensure sessions table migration exists and run migrations
if [ -n "$DB_CONNECTION" ] && [ "$DB_CONNECTION" != "sqlite" ]; then
  # create sessions table migration if not present
  if ! ls database/migrations/*_create_sessions_table.php > /dev/null 2>&1; then
    php artisan session:table || true
  fi

  # run migrations (may fail if DB not reachable yet)
  php artisan migrate --force || true
fi

# Execute the command
exec "$@"
