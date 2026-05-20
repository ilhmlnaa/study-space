#!/bin/sh
set -e

echo "Running database migrations..."
prisma migrate deploy --schema=./prisma/schema.prisma

echo "Running database seed..."
tsx prisma/seed.ts

echo "Starting application..."
exec node server.js
