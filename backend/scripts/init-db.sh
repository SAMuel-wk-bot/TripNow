#!/usr/bin/env bash
# TripNow database init script.
# Generates Prisma client, applies migrations and seeds the database.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env && -f .env.example ]]; then
  echo "→ No .env found, copying from .env.example"
  cp .env.example .env
fi

echo "→ Generating Prisma client"
npx prisma generate

echo "→ Applying migrations"
if [[ "${NODE_ENV:-development}" == "production" ]]; then
  npx prisma migrate deploy
else
  npx prisma migrate dev --name init --skip-seed || npx prisma migrate deploy
fi

echo "→ Seeding database"
npx tsx prisma/seed.ts

echo "✅ Database ready"
