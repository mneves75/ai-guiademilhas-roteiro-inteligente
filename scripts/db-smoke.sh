#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

pnpm db:schema-parity
pnpm db:smoke:sqlite
pnpm db:smoke:pg:local

echo "db:smoke OK"

