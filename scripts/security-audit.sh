#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[1/4] pnpm audit (--prod)"
pnpm -s audit --prod

echo "[2/4] gitleaks (se instalado)"
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks git --redact --no-banner
else
  echo "WARN: gitleaks nao esta instalado; pulando secret scan local."
  echo "      (CI deve executar secret scan de qualquer forma.)"
fi

echo "[3/4] DAST-lite (@dast) via Playwright (Chromium)"
pnpm exec playwright test --project=chromium --grep @dast

echo "[4/4] Gates basicos"
pnpm -s lint
pnpm -s type-check
pnpm -s test

