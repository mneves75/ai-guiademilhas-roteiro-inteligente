#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DOC="docs/security/asvs-mapping.pt-br.md"

contains() {
  local needle="$1"
  local file="$2"

  if command -v rg >/dev/null 2>&1; then
    rg -F -q "$needle" "$file"
  else
    grep -F -q -- "$needle" "$file"
  fi
}

if [[ ! -f "$DOC" ]]; then
  echo "ASVS gate FAIL: arquivo ausente: $DOC"
  exit 1
fi

required_sections=(
  "## V1:"
  "## V2:"
  "## V3:"
  "## V4:"
  "## V5:"
  "## V7:"
  "## V9:"
  "## V12:"
  "## V14:"
  "## Criterio de release"
)

for section in "${required_sections[@]}"; do
  if ! contains "$section" "$DOC"; then
    echo "ASVS gate FAIL: secao obrigatoria ausente no checklist: $section"
    exit 1
  fi
done

required_evidence_paths=(
  "relatorio_seguranca.pt-br.md"
  "app/api/auth/[...all]/route.ts"
  "src/lib/auth.ts"
  "proxy.ts"
  "src/lib/security/rate-limit.ts"
  "src/lib/security/redirect.ts"
  "src/lib/__tests__/security-redirect.vitest.ts"
  "src/lib/storage/local.ts"
  "app/api/files/[...key]/route.ts"
  "next.config.ts"
  ".github/workflows/secret-scan.yml"
  "e2e/protected.e2e.ts"
  "e2e/security-headers.e2e.ts"
  "e2e/security-txt.e2e.ts"
  "app/.well-known/security.txt/route.ts"
)

for path in "${required_evidence_paths[@]}"; do
  if [[ ! -e "$path" ]]; then
    echo "ASVS gate FAIL: evidencia referenciada nao encontrada: $path"
    exit 1
  fi
done

required_commands=(
  "pnpm security:asvs-check"
  "pnpm security:audit"
  "pnpm verify:ci"
)

for cmd in "${required_commands[@]}"; do
  if ! contains "$cmd" "$DOC"; then
    echo "ASVS gate FAIL: comando obrigatorio ausente no checklist: $cmd"
    exit 1
  fi
done

echo "ASVS gate OK: checklist versionado, secoes obrigatorias e evidencias presentes."
