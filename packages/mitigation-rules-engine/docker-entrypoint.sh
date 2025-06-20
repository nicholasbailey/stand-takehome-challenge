#!/bin/sh
set -e

# wait for Postgres
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" > /dev/null 2>&1; do
  echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."
  sleep 2
done

# Run migrations
echo "Running TypeORM migrations..."
npx typeorm-ts-node-commonjs schema:sync -d src/data-source.ts
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts

# Execute passed command
exec "$@" 