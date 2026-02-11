# Reuso do Framework Base (nextjs-bootstrapped-shipped)

Atualizado: 2026-02-11

## Objetivo

Manter este produto (`ai-guiademilhas-roteiro-inteligente`) alinhado ao framework base
`~/dev/PROJETOS/nextjs-bootstrapped-shipped` sem copiar/colar manual a cada ciclo.

## Abordagem de mercado (recomendada)

1. **Modelo de fork com upstream sincronizado** (GitHub): manter origem do produto e sincronizar periodicamente com upstream do framework.
2. **Estrangulamento por fronteiras** (Strangler Pattern): preservar um core compartilhado e evoluir regras de dominio (landing/planner) em camadas claras.
3. **Contratos versionados em APIs criticas**: evitar regressao silenciosa em frontend quando o core evoluir.

Referencias primarias:

- GitHub Docs (sync fork): https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork
- Strangler Pattern (Martin Fowler): https://martinfowler.com/bliki/StranglerFigApplication.html
- Problem Details (RFC 9457): https://www.rfc-editor.org/rfc/rfc9457

## Fronteiras definidas para este projeto

- **Core reutilizado do framework**:
  - auth/workspaces/billing/admin
  - proxy/seguranca base
  - observabilidade/gates/scripts
- **Camada de produto (Guia de Milhas)**:
  - landing e copy de conversao
  - planner (schema, geracao de relatorio, experiencia de formulario)
  - docs de estrategia comercial e qualidade do planner

## Processo operacional (automatizado no projeto)

Comandos disponiveis:

1. Bootstrap de reuso:
   - `pnpm framework:bootstrap`
   - Efeito: inicializa Git local (se necessario), configura remote `upstream`, habilita `git rerere` (`rerere.enabled` + `rerere.autoupdate`) e busca branch padrao automaticamente (`main` ou fallback por `HEAD`, ex.: `master`).
2. Status de divergencia:
   - `pnpm framework:status`
   - Mostra remote configurado e estado local contra `upstream/<branch>`.
3. Preview de sync (sem mutacao):
   - `pnpm framework:preview`
   - Mostra commits e arquivos que seriam incorporados no proximo merge de upstream.
4. Check de drift (sem mutacao):
   - `pnpm framework:check`
   - Falha se `behind > FRAMEWORK_UPSTREAM_MAX_BEHIND` (default `0`).
5. Sync (merge) do upstream:
   - `pnpm framework:sync`
   - Pre-condicoes: working tree limpo e pelo menos 1 commit local.
6. Sync + validacao completa:
   - `pnpm framework:sync:verify`
   - Executa `pnpm verify` apos merge.
7. Resolver conflitos priorizando:
   - manter customizacoes em `app/page.tsx`, `src/content/landing.ts`, `src/lib/planner/**`
   - aceitar evolucoes de infraestrutura em `proxy.ts`, `scripts/**`, `observability/**`

Variaveis opcionais para customizar automacao:

- `FRAMEWORK_UPSTREAM_SOURCE` (default: `FRAMEWORK_UPSTREAM_PATH` ou `~/dev/PROJETOS/nextjs-bootstrapped-shipped`)
- `FRAMEWORK_UPSTREAM_PATH` (compat legado para caminho local)
- `FRAMEWORK_UPSTREAM_REMOTE` (default: `upstream`)
- `FRAMEWORK_UPSTREAM_BRANCH` (default: autodetect com fallback em `main`)
- `FRAMEWORK_UPSTREAM_MAX_BEHIND` (default: `0`, usado em `framework:check`)

## Governanca automatica (CI)

- Workflow: `.github/workflows/upstream-drift.yml`
- Agenda: diaria (`07:00 UTC`) + gatilho manual.
- Politica atual: strict (`FRAMEWORK_UPSTREAM_MAX_BEHIND=0`) contra `https://github.com/mneves75/nextjs-bootstrapped-shipped.git`.
- Workflow: `.github/workflows/upstream-sync-pr.yml`
- Agenda: semanal (segunda, `08:00 UTC`) + gatilho manual.
- Politica: quando houver diff, abre PR automatica `chore/upstream-sync` com validacao baseline no proprio job (`pnpm lint && pnpm test`) e depois checks normais de CI no PR.
- Ownership: `.github/CODEOWNERS` define fronteiras de revisao para core e dominio.

## Estado atual

- Git local inicializado neste workspace.
- Remote `upstream` configurado para `~/dev/PROJETOS/nextjs-bootstrapped-shipped`.
- Branch upstream efetiva detectada automaticamente: `master`.
- Historico local ja foi ligado ao upstream via merge de historicos (`--allow-unrelated-histories`).
- `pnpm framework:sync` executa sem erro e aplica `merge` incremental quando houver novos commits no upstream.

## Criterio 10/10 para reuso sustentavel

1. Cadencia fixa de sync (`semanal` ou `quinzenal`) com owner definido.
2. Checklist de conflitos por fronteira (core vs dominio) versionado.
3. Gate obrigatorio com `pnpm verify` + E2E completo apos cada sync.
4. Contratos de API com versao e testes de compatibilidade.
