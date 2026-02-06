#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

DATA_DIR="$(mktemp -d -t nextjs-sqlite-smoke.XXXXXX)"
DB_PATH="${DATA_DIR}/app.db"

cleanup() {
  set +e
  rm -rf "${DATA_DIR}"
}
trap cleanup EXIT

export DB_PROVIDER=sqlite
export SQLITE_PATH="${DB_PATH}"

echo "SQLite smoke (path=${SQLITE_PATH})"
pnpm db:push:sqlite
pnpm db:seed
pnpm db:assert-seed
pnpm db:portability-check

echo "SQLite smoke OK"

