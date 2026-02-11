#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Uso: scripts/with-e2e-lock.sh <comando...>" >&2
  exit 2
fi

LOCK_DIR="${E2E_LOCK_DIR:-${TMPDIR:-/tmp}/nextjs-e2e-lock}"
LOCK_TIMEOUT_SEC="${E2E_LOCK_TIMEOUT_SEC:-900}"
LOCK_POLL_SEC="${E2E_LOCK_POLL_SEC:-1}"
PID_FILE="${LOCK_DIR}/pid"

start_ts="$(date +%s)"
acquired="0"

cleanup() {
  if [ "${acquired}" = "1" ] && [ -d "${LOCK_DIR}" ]; then
    rm -rf "${LOCK_DIR}" || true
  fi
}
trap cleanup EXIT INT TERM

while true; do
  if mkdir "${LOCK_DIR}" 2>/dev/null; then
    printf '%s\n' "$$" > "${PID_FILE}"
    acquired="1"
    break
  fi

  # Clean stale lock if owner PID no longer exists.
  if [ -f "${PID_FILE}" ]; then
    lock_pid="$(cat "${PID_FILE}" 2>/dev/null || true)"
    if [ -n "${lock_pid}" ] && ! kill -0 "${lock_pid}" 2>/dev/null; then
      rm -rf "${LOCK_DIR}" || true
      continue
    fi
  fi

  now_ts="$(date +%s)"
  elapsed="$((now_ts - start_ts))"
  if [ "${elapsed}" -ge "${LOCK_TIMEOUT_SEC}" ]; then
    echo "ERROR: timeout aguardando lock de E2E em ${LOCK_DIR}" >&2
    exit 1
  fi

  sleep "${LOCK_POLL_SEC}"
done

exec "$@"
