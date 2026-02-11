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
  scripts/framework-upstream.sh check
  scripts/framework-upstream.sh sync [--verify]

Variaveis opcionais:
  FRAMEWORK_UPSTREAM_REMOTE  (default: upstream)
  FRAMEWORK_UPSTREAM_SOURCE  (default: FRAMEWORK_UPSTREAM_PATH or ~/dev/PROJETOS/nextjs-bootstrapped-shipped)
  FRAMEWORK_UPSTREAM_PATH    (compat: caminho local legado)
  FRAMEWORK_UPSTREAM_BRANCH  (default: main)
  FRAMEWORK_UPSTREAM_MAX_BEHIND (default: 0, usado em "check")
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
    ensure_upstream_remote
    fetch_upstream
    print_status
    ;;
  status)
    print_status
    ;;
  check)
    check_upstream
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
