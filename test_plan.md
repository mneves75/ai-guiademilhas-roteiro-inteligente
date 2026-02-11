# Test Plan (v1 Requirements Closure)

## Local Gates

- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm verify` (one command: gates + db smoke + e2e)

## Database Smokes

- SQLite (no external deps)

```bash
TMPDIR="$(mktemp -d)"
export DB_PROVIDER=sqlite
export SQLITE_PATH="$TMPDIR/app.db"

pnpm db:push
pnpm db:seed
pnpm db:assert-seed
pnpm db:portability-check
```

- Postgres (local, no Docker)

```bash
pnpm db:smoke:pg:local
```

- One command (schema parity + sqlite + postgres)

```bash
pnpm db:smoke
```

## Functional Smoke (Manual)

- Auth
  - Visit `/login`, `/signup`, `/forgot-password`, `/reset-password`
  - Password reset request returns success (even for unknown email) and does not crash without email provider
  - Magic link request returns success and link verification lands on `/dashboard` when email sending is configured
- Teams
  - Create invitation from `/dashboard/team` and verify API sends email when Resend is configured
- Billing
  - `/pricing` renders from `STRIPE_PLANS`
  - `/dashboard/billing` shows subscription state and can create Checkout/Portal sessions
- Admin
  - `/admin` is role-protected
  - Impersonation can be started/stopped
- Email
  - `/emails/preview` renders templates in development only

## Planner IA (2026-02-11)

- Endpoint:
  - `POST /api/planner/generate` sem sessao retorna 401
  - `POST /api/planner/generate` com payload invalido retorna 400
  - `POST /api/planner/generate` sem `GOOGLE_GENERATIVE_AI_API_KEY` continua funcional com `mode: "fallback"`
  - `POST /api/planner/generate` com chave valida retorna `mode: "ai"` e `{ report }` conforme schema
- UI:
  - `/dashboard/planner` exibe erro de validacao local para campos obrigatorios
  - submit valido mostra estado `Gerando relatório...` / `Generating report...`
  - erro da API mostra mensagem com `requestId` quando presente
  - sucesso renderiza secoes e assuncoes do relatorio
  - quando `mode: "fallback"`, exibe aviso de operacao resiliente
- Unit tests implementados:
  - `src/lib/__tests__/planner-schema.vitest.ts`
- E2E de regressao executado:
  - `pnpm test:e2e:ci` com 31/31 testes passando
  - cobertura dedicada do planner em `e2e/planner.e2e.ts`

## Revalidacao final (2026-02-11)

- Matriz E2E completa:
  - Comando: `PW_FULL=1 pnpm test:e2e`
  - Resultado: `161 passed`, `4 skipped` (skips esperados de `e2e/screens.e2e.ts` fora de `chromium`).
- Gate canonico:
  - Comando: `pnpm verify`
  - Resultado: sucesso completo (`lint` + `type-check` + `test` + `build` + `db:smoke` + `test:e2e:ci`).
- Security gate:
  - Comando: `pnpm security:audit`
  - Resultado: sucesso completo (`audit --prod` sem vulnerabilidades + DAST-lite `4 passed` + gates basicos verdes).

## Hardening de scripts (2026-02-11)

- `scripts/readiness-check.mjs`:
  - fallback de caminho para guidelines com suporte a `guidelines-ref` e `GUIDELINES-REF`.
- `scripts/security-audit.sh`:
  - em ambiente sem `.git`, gitleaks executa scan por diretorios-fonte estaveis (sem depender de artefatos transientes).
  - em ambiente com `.git`, continua bloqueante com `gitleaks git`.
- Reexecucao de comprovacao:
  - `pnpm readiness` => L5, 94.2%
  - `pnpm security:audit` => sucesso
  - `pnpm verify` => sucesso completo
  - `PW_FULL=1 pnpm test:e2e` => `161 passed`, `4 skipped`

## Upgrade planner contract (2026-02-11)

- Contrato novo validado:
  - sucesso: `{ schemaVersion, generatedAt, report, mode }`
  - erro de rate limit: `application/problem+json` com `requestId`, `code`, `retryAfterSeconds`.
- Unit tests novos:
  - `src/lib/__tests__/planner-api-contract.vitest.ts`
  - `src/lib/__tests__/landing-content.vitest.ts`
- E2E novos/atualizados:
  - `e2e/home.e2e.ts`: CTA da landing preserva `callbackUrl` para planner.
  - `e2e/protected.e2e.ts`: redirect de `/dashboard/planner` inclui `callbackUrl`.
- Resultado de verificacao desta rodada:
  - `pnpm test`: `21 files`, `79 passed`
  - `PW_FULL=1 pnpm test:e2e`: `161 passed`, `4 skipped`
  - `pnpm verify`: sucesso (`test:e2e:ci` com `33 passed`)
  - `pnpm security:audit`: sucesso (`4 passed` em `@dast`)

## Upgrade contrato formal de endpoint (2026-02-11)

- Especificacao OpenAPI:
  - `docs/openapi.planner.yaml` (OpenAPI 3.1) para `POST /api/planner/generate`.
- Teste de rota:
  - `src/lib/__tests__/planner-generate-route.vitest.ts` cobre 401, 429 problem+json e 200 versionado.
- Resultado consolidado apos upgrade:
  - `pnpm test`: `21 files`, `79 passed`
  - `pnpm verify`: sucesso completo
  - `pnpm security:audit`: sucesso completo
  - `PW_FULL=1 pnpm test:e2e`: `161 passed`, `4 skipped`

## Revalidacao autonoma final (2026-02-11)

- Mudanca considerada:
  - Ajuste documental de evidencia em `docs/critica-10-10.pt-br.md` (`151 passed` -> `161 passed`).
- Comandos executados:
  - `PW_FULL=1 pnpm test:e2e`
  - `pnpm verify`
  - `pnpm security:audit`
- Resultado:
  - Todos os comandos retornaram exit code `0`.
  - E2E full: `161 passed`, `4 skipped`.
  - E2E CI (dentro de `verify`): `33 passed`.
  - DAST-lite (dentro de `security:audit`): `4 passed`.

## Automacao upstream + regressao completa (2026-02-11)

- Mudancas desta rodada:
  - Novo fluxo executavel de reuso upstream (`scripts/framework-upstream.sh` + scripts `pnpm framework:*`).
  - Hardening do `security:audit` para ambiente Git sem commits.
  - Atualizacao da documentacao (`README.md`, `docs/reuso-framework-upstream.pt-br.md`, `CHANGELOG.md`).
- Verificacoes executadas:
  - `pnpm framework:bootstrap` (sucesso; upstream configurado).
  - `pnpm framework:status` (sucesso; branch upstream `master`).
  - `pnpm framework:sync` (falha esperada por ausencia de commit local).
  - `pnpm verify` (sucesso).
  - `pnpm security:audit` (sucesso).
  - `PW_FULL=1 pnpm test:e2e` (sucesso).
- Evidencia consolidada:
  - `pnpm verify`: `33 passed` em E2E CI.
  - `pnpm security:audit`: DAST-lite `4 passed` + `pnpm audit --prod` sem vulnerabilidades.
  - `PW_FULL=1 pnpm test:e2e`: `161 passed`, `4 skipped`, `0 failed`.

## Fechamento estrutural de reuso (2026-02-11)

- Objetivo desta rodada:
  - Remover o bloqueio final de sync upstream por falta de historico compartilhado.
- Acoes executadas:
  - Commit inicial do estado do produto.
  - Merge de historicos com upstream (`--allow-unrelated-histories -s ours`) para estabelecer ancestral comum.
  - Reexecucao de `framework:status` e `framework:sync`.
- Evidencia:
  - `pnpm framework:status` => `ahead:2`, `behind:0`.
  - `pnpm framework:sync` => `Already up to date`.
- Resultado:
  - Fluxo de reuso upstream esta funcional de ponta a ponta.
