#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[1/4] pnpm audit (--prod)"
pnpm -s audit --prod

echo "[2/4] gitleaks (se instalado)"
if command -v gitleaks >/dev/null 2>&1; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git rev-parse --verify HEAD >/dev/null 2>&1; then
    gitleaks git --redact --no-banner
  else
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo "WARN: repositorio git sem commits; executando secret scan por diretorios-fonte."
    else
      echo "WARN: repositorio git nao detectado; executando secret scan por diretorios-fonte."
    fi
    declare -a gitleaks_targets=(
      "app"
      "src"
      "scripts"
      "e2e"
      "content"
      "docs"
      "observability"
      "public"
    )
    for target in "${gitleaks_targets[@]}"; do
      if [ -e "$target" ]; then
        echo "  - gitleaks dir $target"
        gitleaks dir --redact --no-banner "$target"
      fi
    done
  fi
else
  echo "WARN: gitleaks nao esta instalado; pulando secret scan local."
  echo "      (CI deve executar secret scan de qualquer forma.)"
fi

echo "[3/4] DAST-lite (@dast) via Playwright (Chromium)"
bash ./scripts/with-e2e-lock.sh pnpm exec playwright test --project=chromium --grep @dast

echo "[4/4] Gates basicos"
pnpm -s lint
pnpm -s type-check
pnpm -s test
