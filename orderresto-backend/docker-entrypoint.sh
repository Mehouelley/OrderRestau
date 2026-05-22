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

# Execute the command
exec "$@"
