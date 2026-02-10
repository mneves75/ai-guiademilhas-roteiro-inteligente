#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

MODE="${1:-dev}"

if [[ "$MODE" == "-h" || "$MODE" == "--help" ]]; then
  cat <<'EOF'
Usage: ./init.sh [mode]

modes:
  dev         Setup + run dev server (default)
  prod        Setup + build + run production server
  setup-only  Setup only (do not start a server)

Notes:
- Default local dev uses SQLite (DB_PROVIDER=sqlite) and stores files under ./data/
- If you already have a .env.local, this script will not overwrite it.
EOF
  exit 0
fi

echo "==> init.sh: bootstrapping nextjs-bootstrapped-shipped (${MODE})"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found. Install Node.js 18+ and retry." >&2
  exit 1
fi

# Ensure pnpm is available via Corepack (Node.js 16+).
if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@10.28.2 --activate >/dev/null 2>&1 || true
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm not found. Install pnpm (or enable Corepack) and retry." >&2
  exit 1
fi

echo "==> Installing dependencies"
pnpm install

ENV_WAS_CREATED=0
if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  ENV_WAS_CREATED=1
  echo "==> Created .env.local from .env.example"
fi

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"

  if [[ ! -f "$file" ]]; then
    echo "ERROR: expected $file to exist" >&2
    exit 1
  fi

  if grep -qE "^${key}=" "$file"; then
    # macOS sed needs an extension for -i. Keep it portable across macOS/Linux.
    sed -i.bak -E "s|^${key}=.*|${key}=${value}|" "$file"
    rm -f "${file}.bak"
    return
  fi

  printf "\n%s=%s\n" "$key" "$value" >> "$file"
}

# Local-first defaults: SQLite + local uploads.
# Keep this deterministic so anyone can run the demo without external services.
LOCAL_DB_PROVIDER="sqlite"
LOCAL_SQLITE_PATH="./data/app.db"
LOCAL_STORAGE_PROVIDER="local"
LOCAL_STORAGE_PATH="./data/uploads"

mkdir -p "$LOCAL_STORAGE_PATH"

# Only rewrite .env.local when we created it (avoid clobbering existing user config).
if [[ "$ENV_WAS_CREATED" == "1" && -f .env.local ]]; then
  upsert_env .env.local DB_PROVIDER "$LOCAL_DB_PROVIDER"
  upsert_env .env.local SQLITE_PATH "$LOCAL_SQLITE_PATH"
  upsert_env .env.local STORAGE_PROVIDER "$LOCAL_STORAGE_PROVIDER"
  upsert_env .env.local STORAGE_LOCAL_PATH "$LOCAL_STORAGE_PATH"
  upsert_env .env.local NEXT_PUBLIC_APP_URL http://localhost:3000
  upsert_env .env.local BETTER_AUTH_BASE_URL http://localhost:3000
  upsert_env .env.local BETTER_AUTH_URL http://localhost:3000

  # Avoid accidental external calls during local testing.
  upsert_env .env.local RESEND_API_KEY ""
  upsert_env .env.local STRIPE_SECRET_KEY ""
  upsert_env .env.local STRIPE_WEBHOOK_SECRET ""
  upsert_env .env.local NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ""
  upsert_env .env.local STRIPE_PRO_MONTHLY_PRICE_ID ""
  upsert_env .env.local STRIPE_PRO_YEARLY_PRICE_ID ""
  upsert_env .env.local STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ""
  upsert_env .env.local STRIPE_ENTERPRISE_YEARLY_PRICE_ID ""
  upsert_env .env.local STRIPE_ONE_TIME_PRICE_ID ""
fi

echo "==> Preparing database (SQLite): schema push + seed"
DB_PROVIDER="$LOCAL_DB_PROVIDER" SQLITE_PATH="$LOCAL_SQLITE_PATH" pnpm -s db:push
DB_PROVIDER="$LOCAL_DB_PROVIDER" SQLITE_PATH="$LOCAL_SQLITE_PATH" pnpm -s db:seed

case "$MODE" in
  setup-only)
    echo "==> Setup complete. Next: pnpm dev"
    ;;
  prod)
    echo "==> Building"
    DB_PROVIDER="$LOCAL_DB_PROVIDER" SQLITE_PATH="$LOCAL_SQLITE_PATH" pnpm -s build
    echo "==> Starting production server on http://localhost:3000"
    DB_PROVIDER="$LOCAL_DB_PROVIDER" SQLITE_PATH="$LOCAL_SQLITE_PATH" pnpm start
    ;;
  dev)
    echo "==> Starting dev server on http://localhost:3000"
    DB_PROVIDER="$LOCAL_DB_PROVIDER" SQLITE_PATH="$LOCAL_SQLITE_PATH" pnpm dev
    ;;
  *)
    echo "ERROR: unknown mode: $MODE (expected: dev | prod | setup-only)" >&2
    exit 1
    ;;
esac
