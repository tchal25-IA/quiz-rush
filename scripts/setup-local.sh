#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Quiz Rush — setup local"

if command -v docker >/dev/null 2>&1; then
  echo "→ docker compose up -d"
  docker compose up -d
else
  echo "→ Docker absent : utilise Postgres/Redis locaux (Homebrew)"
  export PATH="$(brew --prefix postgresql@16 2>/dev/null)/bin:$(brew --prefix redis 2>/dev/null)/bin:${PATH}"
  brew services start postgresql@16 2>/dev/null || true
  brew services start redis 2>/dev/null || true
  sleep 1
  psql -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='quizrush'" | grep -q 1 || \
    psql -d postgres -c "CREATE USER quizrush WITH SUPERUSER PASSWORD 'quizrush';" || true
  psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='quizrush'" | grep -q 1 || \
    createdb -O quizrush quizrush || true
fi

cp -n apps/api/.env.example apps/api/.env 2>/dev/null || true

echo "→ npm install"
npm install

echo "→ build shared + migrate + seed"
npm run build:shared
cd apps/api
npx prisma migrate dev --name init --skip-seed
npm run prisma:seed
cd "$ROOT"

echo ""
echo "✅ Setup OK"
echo "   API    : npm run dev:api"
echo "   Mobile : npm run dev:mobile"
