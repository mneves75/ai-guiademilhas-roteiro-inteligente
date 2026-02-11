#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

UPSTREAM_REMOTE="${FRAMEWORK_UPSTREAM_REMOTE:-upstream}"
UPSTREAM_SOURCE="${FRAMEWORK_UPSTREAM_SOURCE:-${FRAMEWORK_UPSTREAM_PATH:-$HOME/dev/PROJETOS/nextjs-bootstrapped-shipped}}"
UPSTREAM_BRANCH="${FRAMEWORK_UPSTREAM_BRANCH:-$(git config --get framework.upstreamBranch 2>/dev/null || echo main)}"

usage() {
  cat <<USAGE
Uso:
  scripts/framework-upstream.sh bootstrap
  scripts/framework-upstream.sh status
  scripts/framework-upstream.sh preview
  scripts/framework-upstream.sh check
  scripts/framework-upstream.sh doctor
  scripts/framework-upstream.sh sync [--verify]

Variaveis opcionais:
  FRAMEWORK_UPSTREAM_REMOTE  (default: upstream)
  FRAMEWORK_UPSTREAM_SOURCE  (default: FRAMEWORK_UPSTREAM_PATH or ~/dev/PROJETOS/nextjs-bootstrapped-shipped)
  FRAMEWORK_UPSTREAM_PATH    (compat: caminho local legado)
  FRAMEWORK_UPSTREAM_BRANCH  (default: main)
  FRAMEWORK_UPSTREAM_MAX_BEHIND (default: 0, usado em "check")
  FRAMEWORK_DOCTOR_STRICT (default: 0, warnings tambem quebram no modo estrito)
  FRAMEWORK_DOCTOR_TARGET_BRANCH (default: branch padrao do repo remoto em "doctor")
USAGE
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

is_git_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1
}

has_head_commit() {
  git rev-parse --verify HEAD >/dev/null 2>&1
}

ensure_git_repo() {
  if is_git_repo; then
    return 0
  fi

  echo "Inicializando repositorio Git local..."
  if git init -b main >/dev/null 2>&1; then
    return 0
  fi

  git init >/dev/null
  git symbolic-ref HEAD refs/heads/main >/dev/null 2>&1 || true
}

configure_git_merge_helpers() {
  git config rerere.enabled true >/dev/null 2>&1 || true
  git config rerere.autoupdate true >/dev/null 2>&1 || true
}

is_remote_source() {
  case "$1" in
    http://*|https://*|ssh://*|git@*|git://*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

has_command() {
  command -v "$1" >/dev/null 2>&1
}

resolve_upstream_target() {
  local source="${UPSTREAM_SOURCE/#\~/$HOME}"
  [ -n "$source" ] || die "FRAMEWORK_UPSTREAM_SOURCE vazio."

  if [ -d "$source" ]; then
    [ -d "$source/.git" ] || die "FRAMEWORK_UPSTREAM_SOURCE aponta para pasta sem .git: $source"
    echo "$source"
    return 0
  fi

  if is_remote_source "$source"; then
    echo "$source"
    return 0
  fi

  if [[ "$source" == /* || "$source" == ./* || "$source" == ../* || "$source" == ~* ]]; then
    die "FRAMEWORK_UPSTREAM_SOURCE parece caminho local inexistente: $source"
  fi

  # Fallback: permite formatos de remote nao capturados acima.
  echo "$source"
}

ensure_upstream_remote() {
  local upstream_target
  upstream_target="$(resolve_upstream_target)"

  if git remote get-url "$UPSTREAM_REMOTE" >/dev/null 2>&1; then
    git remote set-url "$UPSTREAM_REMOTE" "$upstream_target"
  else
    git remote add "$UPSTREAM_REMOTE" "$upstream_target"
  fi
}

fetch_upstream() {
  if git fetch "$UPSTREAM_REMOTE" "$UPSTREAM_BRANCH" --prune; then
    return 0
  fi

  if [ -n "${FRAMEWORK_UPSTREAM_BRANCH:-}" ]; then
    die "Nao foi possivel buscar branch '$UPSTREAM_BRANCH' do remote '$UPSTREAM_REMOTE'."
  fi

  local detected_branch
  detected_branch="$(
    git ls-remote --symref "$(git remote get-url "$UPSTREAM_REMOTE")" HEAD 2>/dev/null \
      | awk '/^ref: / { print $2 }' \
      | sed 's@refs/heads/@@' \
      | head -n1
  )"
  [ -n "$detected_branch" ] || die "Nao foi possivel detectar branch padrao do upstream."

  echo "Branch '$UPSTREAM_BRANCH' nao encontrada; usando '$detected_branch' como branch upstream."
  UPSTREAM_BRANCH="$detected_branch"
  git config framework.upstreamBranch "$UPSTREAM_BRANCH" >/dev/null 2>&1 || true
  git fetch "$UPSTREAM_REMOTE" "$UPSTREAM_BRANCH" --prune
}

print_status() {
  if ! is_git_repo; then
    echo "Repo Git: nao inicializado neste diretorio."
    return 0
  fi

  if ! git remote get-url "$UPSTREAM_REMOTE" >/dev/null 2>&1; then
    echo "Remote '$UPSTREAM_REMOTE': nao configurado."
    return 0
  fi

  echo "Repo Git: inicializado"
  echo "Remote $UPSTREAM_REMOTE: $(git remote get-url "$UPSTREAM_REMOTE")"
  fetch_upstream >/dev/null 2>&1 || fetch_upstream
  echo "Branch upstream alvo: $UPSTREAM_BRANCH"

  if has_head_commit; then
    local ahead
    local behind
    if read -r ahead behind < <(git rev-list --left-right --count "HEAD...$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" 2>/dev/null); then
      :
    else
      ahead="n/a"
      behind="n/a"
    fi
    echo "Divergencia vs $UPSTREAM_REMOTE/$UPSTREAM_BRANCH -> ahead:$ahead behind:$behind"
    git status --short
  else
    echo "HEAD: inexistente (sem commits locais)."
    echo "Proximo passo sugerido: criar commit inicial antes de sync por merge."
  fi
}

preview_sync() {
  is_git_repo || die "Repositorio Git nao inicializado. Rode: pnpm framework:bootstrap"
  git remote get-url "$UPSTREAM_REMOTE" >/dev/null 2>&1 || die "Remote '$UPSTREAM_REMOTE' nao configurado. Rode: pnpm framework:bootstrap"
  has_head_commit || die "Sem commits locais. Crie um commit inicial antes de preview."

  fetch_upstream
  echo "Branch upstream alvo: $UPSTREAM_BRANCH"

  local ahead
  local behind
  if ! read -r ahead behind < <(git rev-list --left-right --count "HEAD...$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" 2>/dev/null); then
    die "Nao foi possivel calcular divergencia contra $UPSTREAM_REMOTE/$UPSTREAM_BRANCH."
  fi

  echo "Divergencia vs $UPSTREAM_REMOTE/$UPSTREAM_BRANCH -> ahead:$ahead behind:$behind"
  if [ "$behind" -eq 0 ]; then
    echo "Sem commits novos no upstream para aplicar."
    return 0
  fi

  echo
  echo "Commits do upstream ainda nao aplicados (mais antigos primeiro):"
  git log --reverse --oneline "HEAD..$UPSTREAM_REMOTE/$UPSTREAM_BRANCH"

  echo
  echo "Arquivos impactados no sync:"
  git diff --name-only "HEAD..$UPSTREAM_REMOTE/$UPSTREAM_BRANCH"
}

check_upstream() {
  local max_behind="${FRAMEWORK_UPSTREAM_MAX_BEHIND:-0}"

  is_git_repo || die "Repositorio Git nao inicializado. Rode: pnpm framework:bootstrap"
  git remote get-url "$UPSTREAM_REMOTE" >/dev/null 2>&1 || die "Remote '$UPSTREAM_REMOTE' nao configurado. Rode: pnpm framework:bootstrap"
  has_head_commit || die "Sem commits locais. Crie um commit inicial antes de check."

  [[ "$max_behind" =~ ^[0-9]+$ ]] || die "FRAMEWORK_UPSTREAM_MAX_BEHIND invalido: $max_behind"

  fetch_upstream
  echo "Branch upstream alvo: $UPSTREAM_BRANCH"

  local ahead
  local behind
  if ! read -r ahead behind < <(git rev-list --left-right --count "HEAD...$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" 2>/dev/null); then
    die "Nao foi possivel calcular divergencia contra $UPSTREAM_REMOTE/$UPSTREAM_BRANCH."
  fi

  echo "Divergencia vs $UPSTREAM_REMOTE/$UPSTREAM_BRANCH -> ahead:$ahead behind:$behind"
  if [ "$behind" -gt "$max_behind" ]; then
    die "Repo esta $behind commits atras do upstream (max permitido: $max_behind). Rode: pnpm framework:sync"
  fi

  echo "Upstream check OK (behind <= $max_behind)."
}

extract_github_repo_from_remote() {
  local remote_url="$1"

  case "$remote_url" in
    git@github.com:*)
      echo "${remote_url#git@github.com:}" | sed 's/\.git$//'
      return 0
      ;;
    ssh://git@github.com/*)
      echo "${remote_url#ssh://git@github.com/}" | sed 's/\.git$//'
      return 0
      ;;
    https://github.com/*|http://github.com/*)
      local without_scheme
      without_scheme="${remote_url#https://github.com/}"
      without_scheme="${without_scheme#http://github.com/}"
      without_scheme="${without_scheme%%\?*}"
      without_scheme="${without_scheme%%#*}"
      echo "${without_scheme%/}" | sed 's/\.git$//'
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

doctor_framework() {
  local strict="${FRAMEWORK_DOCTOR_STRICT:-0}"
  local failures=0
  local warnings=0
  local limits=0
  local oks=0

  [[ "$strict" =~ ^[01]$ ]] || die "FRAMEWORK_DOCTOR_STRICT invalido: $strict (use 0 ou 1)"

  doctor_ok() {
    echo "[OK] $*"
    oks=$((oks + 1))
  }

  doctor_warn() {
    echo "[WARN] $*"
    warnings=$((warnings + 1))
  }

  doctor_fail() {
    echo "[FAIL] $*"
    failures=$((failures + 1))
  }

  doctor_limit() {
    echo "[LIMIT] $*"
    limits=$((limits + 1))
  }

  if ! is_git_repo; then
    doctor_fail "Repositorio Git nao inicializado."
  else
    doctor_ok "Repositorio Git inicializado."
  fi

  if [ -f ".github/CODEOWNERS" ]; then
    doctor_ok "CODEOWNERS presente (.github/CODEOWNERS)."
  else
    doctor_fail "CODEOWNERS ausente (.github/CODEOWNERS)."
  fi

  local upstream_url=""
  if upstream_url="$(git remote get-url "$UPSTREAM_REMOTE" 2>/dev/null)"; then
    doctor_ok "Remote upstream configurado: $UPSTREAM_REMOTE -> $upstream_url"
    if fetch_upstream >/dev/null 2>&1; then
      doctor_ok "Fetch upstream funcional (branch alvo: $UPSTREAM_BRANCH)."
    else
      doctor_fail "Falha ao buscar upstream ($UPSTREAM_REMOTE/$UPSTREAM_BRANCH)."
    fi
  else
    doctor_fail "Remote '$UPSTREAM_REMOTE' nao configurado."
  fi

  local origin_url=""
  if origin_url="$(git remote get-url origin 2>/dev/null)"; then
    doctor_ok "Remote origin configurado: $origin_url"
  else
    if [ "$strict" = "1" ]; then
      doctor_fail "Remote origin nao configurado (obrigatorio em modo estrito)."
    else
      doctor_warn "Remote origin nao configurado (push/PR automatizavel indisponivel)."
    fi
  fi

  local github_repo=""
  if [ -n "$origin_url" ]; then
    if github_repo="$(extract_github_repo_from_remote "$origin_url")"; then
      doctor_ok "Origin aponta para GitHub repo: $github_repo"
    else
      if [ "$strict" = "1" ]; then
        doctor_fail "Origin nao aponta para GitHub (branch protection nao verificavel automaticamente)."
      else
        doctor_warn "Origin nao aponta para GitHub; branch protection nao verificada."
      fi
    fi
  fi

  if [ -n "$github_repo" ]; then
    if ! has_command gh; then
      if [ "$strict" = "1" ]; then
        doctor_fail "CLI 'gh' nao encontrada."
      else
        doctor_warn "CLI 'gh' nao encontrada; branch protection nao verificada."
      fi
    elif ! gh auth status >/dev/null 2>&1; then
      if [ "$strict" = "1" ]; then
        doctor_fail "gh sem autenticacao valida."
      else
        doctor_warn "gh sem autenticacao valida; branch protection nao verificada."
      fi
    else
      local repo_json
      local target_branch
      local protection_json
      local codeowners_required
      local status_checks_required
      local required_review_count

      if repo_json="$(gh api "repos/$github_repo" 2>/dev/null)"; then
        local default_branch
        default_branch="$(
          printf '%s' "$repo_json" \
            | node -e 'const fs=require("node:fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(j.default_branch ?? ""));'
        )"
        target_branch="${FRAMEWORK_DOCTOR_TARGET_BRANCH:-$default_branch}"
      else
        target_branch="${FRAMEWORK_DOCTOR_TARGET_BRANCH:-}"
      fi

      if [ -z "$target_branch" ]; then
        target_branch="main"
      fi

      local protection_error=""
      if protection_json="$(
        gh api -H "Accept: application/vnd.github+json" "repos/$github_repo/branches/$target_branch/protection" 2>&1
      )"; then
        codeowners_required="$(
          printf '%s' "$protection_json" \
            | node -e 'const fs=require("node:fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(Boolean(j.required_pull_request_reviews?.require_code_owner_reviews)));'
        )"
        status_checks_required="$(
          printf '%s' "$protection_json" \
            | node -e 'const fs=require("node:fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(Boolean(j.required_status_checks)));'
        )"
        required_review_count="$(
          printf '%s' "$protection_json" \
            | node -e 'const fs=require("node:fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));const n=j.required_pull_request_reviews?.required_approving_review_count ?? 0;process.stdout.write(String(n));'
        )"

        if [ "$codeowners_required" = "true" ]; then
          doctor_ok "Branch protection ($target_branch): CODEOWNERS review obrigatoria."
        else
          doctor_fail "Branch protection ($target_branch): CODEOWNERS review NAO obrigatoria."
        fi

        if [ "$status_checks_required" = "true" ]; then
          doctor_ok "Branch protection ($target_branch): status checks obrigatorios habilitados."
        else
          if [ "$strict" = "1" ]; then
            doctor_fail "Branch protection ($target_branch): status checks obrigatorios ausentes."
          else
            doctor_warn "Branch protection ($target_branch): status checks obrigatorios ausentes."
          fi
        fi

        if [ "$required_review_count" -ge 1 ] 2>/dev/null; then
          doctor_ok "Branch protection ($target_branch): minimo de approvals = $required_review_count."
        else
          if [ "$strict" = "1" ]; then
            doctor_fail "Branch protection ($target_branch): approvals minimos nao configurados."
          else
            doctor_warn "Branch protection ($target_branch): approvals minimos nao configurados."
          fi
        fi
      else
        protection_error="$protection_json"
        if printf '%s' "$protection_error" | grep -q "Upgrade to GitHub Pro or make this repository public"; then
          doctor_limit "Branch protection indisponivel para repo privado no plano atual ($github_repo:$target_branch)."
          doctor_limit "Para validacao total: tornar repo publico ou usar plano com suporte a branch protection."
        elif [ "$strict" = "1" ]; then
          doctor_fail "Branch protection nao encontrada/acessivel para $github_repo:$target_branch."
        else
          doctor_warn "Branch protection nao encontrada/acessivel para $github_repo:$target_branch."
        fi
      fi
    fi
  fi

  echo
  echo "Doctor summary -> ok:$oks warn:$warnings limit:$limits fail:$failures"

  if [ "$failures" -gt 0 ]; then
    exit 1
  fi

  if [ "$strict" = "1" ] && [ "$warnings" -gt 0 ]; then
    die "Doctor strict falhou devido a warnings."
  fi
}

sync_upstream() {
  local verify_after="${1:-}"

  is_git_repo || die "Repositorio Git nao inicializado. Rode: pnpm framework:bootstrap"
  git remote get-url "$UPSTREAM_REMOTE" >/dev/null 2>&1 || die "Remote '$UPSTREAM_REMOTE' nao configurado. Rode: pnpm framework:bootstrap"
  has_head_commit || die "Sem commits locais. Crie um commit inicial antes do sync."

  git diff --quiet || die "Working tree com mudancas nao commitadas."
  git diff --cached --quiet || die "Index com mudancas nao commitadas."

  fetch_upstream
  echo "Aplicando merge de $UPSTREAM_REMOTE/$UPSTREAM_BRANCH..."
  git merge --no-edit "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH"

  if [ "$verify_after" = "--verify" ]; then
    echo "Rodando verify apos merge..."
    pnpm verify
  fi
}

cmd="${1:-}"
case "$cmd" in
  bootstrap)
    ensure_git_repo
    configure_git_merge_helpers
    ensure_upstream_remote
    fetch_upstream
    print_status
    ;;
  status)
    print_status
    ;;
  preview)
    preview_sync
    ;;
  check)
    check_upstream
    ;;
  doctor)
    doctor_framework
    ;;
  sync)
    sync_upstream "${2:-}"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    die "Comando invalido: ${cmd:-<vazio>}"
    ;;
esac
