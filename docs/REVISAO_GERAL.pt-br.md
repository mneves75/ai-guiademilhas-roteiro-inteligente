# Revisao Geral (10/10) - 2026-02-07

## Objetivo

Elevar o repo para um estado "agent-ready" com qualidade verificavel, alinhado ao `~/dev/guidelines-ref` e a praticas padrao de industria:

- um unico caminho de build/test (pnpm) e gates automatizaveis;
- observabilidade minima (logs estruturados, health, metrics, error tracking, tracing) sem acoplamento excessivo;
- seguranca e multi-tenancy como defaults, nao como patches tardios.

## Stack verificada (versoes do repo)

Base (web app):

- Next.js `16.1.6` (App Router, Turbopack)
- React / React DOM `19.2.4`
- TypeScript `5.9.3` (strict)
- pnpm `10.28.2`
- Tailwind CSS `4.1.18`

Data + auth + billing:

- Drizzle ORM `0.45.1` (+ Drizzle Kit `0.31.8`)
- Better Auth `1.4.18`
- Stripe `20.3.0` (+ `@stripe/stripe-js` `8.7.0`)
- Resend `6.9.1`

Qualidade:

- ESLint `9.x` (`pnpm lint`)
- Prettier `3.x` (`pnpm format:check`)
- Vitest `4.0.18` (`pnpm test`)
- Playwright `1.58.1` (`pnpm test:e2e:ci`)

Observabilidade (opcional por env):

- pino `10.3.0`
- Sentry Node `10.38.0`
- OpenTelemetry SDK Node `0.211.0` + auto-instrumentations
- prom-client `15.1.3` (endpoint `/metrics` com token em producao)

## Critica (primeiros principios) e decisoes

1. Evitar "gaming" de checks.
   - Solucao anterior (na pratica) para passar `console-logs-minimal` via symlinks de `node_modules/.next` e para passar `tests-pass` via `bun test` adicionando testes em Bun.
   - Isso e fragil: quebra `pnpm add`, confunde `.gitignore` (symlink vs dir) e cria um segundo runtime de testes sem ganho real.

2. A solucao elegante e consertar o avaliador.
   - Atualizei o `guidelines-ref` para aplicar o padrao de industria:
     - `console-logs-minimal` agora ignora dirs de dependencias e artefatos (`node_modules`, `.next`, `.next-playwright`, etc).
     - `tests-pass` / `tests-fast` e `build-succeeds` executam o gerenciador correto baseado no lockfile (ex.: `pnpm test`, `pnpm build`).
     - `no-deprecated-deps` foi implementado para checar **dependencias diretas resolvidas** via `pnpm-lock.yaml` com consulta ao registry (fail fechado se nao conseguir verificar).

3. O repo fica "normal" de novo.
   - Removi a necessidade de symlinks e de testes Bun dedicados.
   - Mantive os gates do repo via `pnpm` (sem trucos de ambiente).

## Evidencia (verificacao executada)

Todos os comandos abaixo passaram em `2026-02-07`:

- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e:ci`
- `pnpm db:smoke`
- `pnpm audit --prod` (0 vulnerabilidades)
- `bun ~/dev/guidelines-ref/tools/readiness-check.ts --format=json --app=.` (L5 / 100%)

## O que faltaria para "mais que 10/10" (opcional)

- Reduzir avisos de _deprecated transitive deps_ vindos de upstream (ex.: `glob@11` via `react-email`, `@esbuild-kit/*` via `drizzle-kit`) quando os mantenedores liberarem upgrades compatveis.
- Runbooks de producao (SLOs, alertas, playbooks) e dashboards com cardinalidade controlada.
