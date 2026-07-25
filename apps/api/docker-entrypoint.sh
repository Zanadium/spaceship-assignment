#!/bin/sh
set -e

# Apply any pending database migrations before starting. `migrate deploy` only
# runs migrations that haven't been applied yet, so it's safe on every boot.
# Set RUN_MIGRATIONS=false to skip (e.g. run migrations as a Coolify pre-deploy
# command instead). The Prisma schema lives in the db workspace package.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Applying database migrations..."
  (cd /app/packages/db && node_modules/.bin/prisma migrate deploy)
fi

echo "[entrypoint] Starting API on port ${PORT:-3000}..."
exec node /app/apps/api/dist/main.js
