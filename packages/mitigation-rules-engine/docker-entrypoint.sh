#!/bin/sh
set -e

# wait for Postgres
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" > /dev/null 2>&1; do
  echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."
  sleep 2
done

# Build the project first
echo "Building project..."
npm run build

# Run migrations
echo "Running TypeORM migrations..."
npx typeorm schema:sync -d dist/data-source.js
npx typeorm migration:run -d dist/data-source.js

# Execute passed command
exec "$@" 