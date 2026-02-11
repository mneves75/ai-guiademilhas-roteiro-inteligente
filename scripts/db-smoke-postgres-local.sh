#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

find_pg_bin() {
  if command -v initdb >/dev/null 2>&1; then
    dirname "$(command -v initdb)"
    return 0
  fi

  local candidates=(
    "/opt/homebrew/opt/postgresql@18/bin"
    "/opt/homebrew/opt/postgresql@17/bin"
    "/opt/homebrew/opt/postgresql@16/bin"
    "/opt/homebrew/opt/postgresql@15/bin"
    "/usr/local/opt/postgresql@16/bin"
    "/usr/local/opt/postgresql@15/bin"
    "/usr/local/opt/postgresql/bin"
  )

  local c
  for c in "${candidates[@]}"; do
    if [ -x "${c}/initdb" ] && [ -x "${c}/pg_ctl" ] && [ -x "${c}/createdb" ]; then
      echo "${c}"
      return 0
    fi
  done

  return 1
}

is_port_free() {
  local port="$1"
  ! lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
}

PG_BIN="${PG_BIN:-}"
if [ -z "${PG_BIN}" ]; then
  if ! PG_BIN="$(find_pg_bin)"; then
    echo "Could not find PostgreSQL binaries (initdb/pg_ctl/createdb)."
    echo "Install Postgres via Homebrew (recommended) or set PG_BIN=/path/to/pg/bin."
    exit 1
  fi
fi

PORT="${PG_PORT:-}"
if [ -z "${PORT}" ]; then
  for p in 55432 55433 55434 55435 55436 55437 55438 55439 55440 55441 55442; do
    if is_port_free "${p}"; then
      PORT="${p}"
      break
    fi
  done
fi

if [ -z "${PORT}" ]; then
  echo "Could not find a free port for local Postgres (tried 55432-55442)."
  exit 1
fi

DATA_DIR="$(mktemp -d -t nextjs-pg-smoke.XXXXXX)"
LOG_FILE="${DATA_DIR}/postgres.log"
DB_NAME="${PG_DB_NAME:-nextjs_test}"

cleanup() {
  set +e
  "${PG_BIN}/pg_ctl" -D "${DATA_DIR}" -t 10 stop -m fast >/dev/null 2>&1 || \
    "${PG_BIN}/pg_ctl" -D "${DATA_DIR}" -t 5 stop -m immediate >/dev/null 2>&1 || true
  rm -rf "${DATA_DIR}"
}
trap cleanup EXIT

echo "Initializing temp Postgres cluster in ${DATA_DIR} (port=${PORT})"
"${PG_BIN}/initdb" -A trust -U postgres -D "${DATA_DIR}" >/dev/null

echo "Starting Postgres..."
"${PG_BIN}/pg_ctl" -D "${DATA_DIR}" -l "${LOG_FILE}" -o "-p ${PORT} -c listen_addresses=127.0.0.1" start >/dev/null

echo "Waiting for Postgres to become ready..."
for _ in $(seq 1 50); do
  if "${PG_BIN}/pg_isready" -h 127.0.0.1 -p "${PORT}" -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

if ! "${PG_BIN}/pg_isready" -h 127.0.0.1 -p "${PORT}" -U postgres >/dev/null 2>&1; then
  echo "Postgres failed to start. Log follows:"
  tail -n 200 "${LOG_FILE}" || true
  exit 1
fi

echo "Creating database ${DB_NAME}..."
"${PG_BIN}/createdb" -h 127.0.0.1 -p "${PORT}" -U postgres "${DB_NAME}"

export DB_PROVIDER=postgres
export DATABASE_URL="postgresql://postgres@127.0.0.1:${PORT}/${DB_NAME}"

echo "Running Postgres smoke against ${DATABASE_URL}"
pnpm db:push:pg
pnpm db:seed
pnpm db:assert-seed
pnpm db:portability-check

echo "Postgres local smoke OK"
