#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -c '\q' 2>/dev/null; do
  sleep 2
done

echo "Running seeder..."
alembic upgrade head
python seed.py

echo "Seed completed."
