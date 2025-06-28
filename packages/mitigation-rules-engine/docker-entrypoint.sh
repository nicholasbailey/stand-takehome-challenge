#!/bin/sh
set -e

# wait for Postgres
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" > /dev/null 2>&1; do
  echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."
  sleep 2
done

# Run migrations (using typeorm-ts-node-commonjs to handle TypeScript)
echo "Running TypeORM migrations..."
npm run typeorm schema:sync -- -d src/data-source.ts
npm run typeorm migration:run -- -d src/data-source.ts

# Execute passed command
exec "$@" 