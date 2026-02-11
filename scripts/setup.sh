#!/usr/bin/env bash
set -euo pipefail

echo "==> Setting up nextjs-bootstrapped-shipped"

# Ensure pnpm is available via Corepack (Node.js 16+).
if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@10.28.2 --activate >/dev/null 2>&1 || true
fi

pnpm install

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "==> Created .env.local from .env.example (fill required values)."
fi

echo "==> Done. Next:"
echo "    pnpm dev"

