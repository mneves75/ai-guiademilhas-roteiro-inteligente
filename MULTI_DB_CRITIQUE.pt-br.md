# Critica de Primeiro Principio: Multi-DB (Drizzle) no Next.js

Este documento descreve o que esta implementacao esta tentando otimizar, os trade-offs assumidos, e quais invariantes precisam ser verdadeiros para manter o sistema correto e previsivel.

## Objetivo

Ter um unico codigo-base que funcione com:

- Postgres (Node runtime)
- SQLite (dev/CI/local, via `better-sqlite3`)
- Cloudflare D1 (Workers)

Sem quebrar `next build`, sem fallback silencioso, e com uma API coerente de acesso ao DB.

## Criterios de Sucesso (pass/fail)

1. `DB_PROVIDER` invalido falha imediatamente com erro explicito.
2. Postgres sem `DATABASE_URL` falha no primeiro acesso real ao DB (nao no import).
3. Import/build nunca abre conexao: conexoes so nascem no primeiro uso real do cliente.
4. Seed e migracoes funcionam por provider (ou falham com mensagem clara quando nao suportado no ambiente).
5. Lint e typecheck passam em clone limpo (sem depender de `.next/*`).
6. CI valida Postgres e SQLite com `push + seed + assert-seed`.

## Principios (primeiros principios, nao framework lore)

1. **Invariantes explicitos**: env vars sao input nao confiavel. Validar cedo e com mensagens acionaveis.
2. **Sem efeitos colaterais no import**: no App Router, imports acontecem em build, testes e tooling. Conexao eager e bug.
3. **Falhar perto da causa**: se falta `DATABASE_URL`, o erro deve dizer isso, nao explodir depois em uma query.
4. **Separar dialeto de features**: o runtime deve ser honesto. Se voce compila SQL Postgres-only e roda no SQLite, vai quebrar.
5. **Superficie minima**: cada camada extra vira um lugar novo para estados invalidos viverem.

## O que foi implementado (padrao industria, pragmatico)

- **Validacao fail-fast de provider**: `DB_PROVIDER` e limitado a `postgres | sqlite | d1`. Typos quebram na hora.
- **Lazy init**: `db` e `dbEdge` sao proxys que criam o cliente no primeiro acesso. Importar o modulo nao conecta.
- **Mensagens de erro orientadas a acao**: erros citam a variavel faltando e o provider em uso.
- **Tooling por provider (drizzle-kit)**:
  - `drizzle.config.ts` resolve baseado em `DB_PROVIDER` (um comando, varios dialetos).
  - Configs explicitas existem para uso direto quando necessario.
- **Smokes por dialeto em CI**: workflows rodam `push + seed + assert-seed` em Postgres e SQLite.
- **Lint de portabilidade**: ESLint bloqueia `sql``...`` (raw SQL) e o import de `sql`de`drizzle-orm` para reduzir drift para features PG-only.

## Trade-offs (o que esta caro e por que aceitavel)

### 1) Cast de tipo entre dialetos

O cliente exportado usa Postgres como superficie canonica de tipos e faz cast para manter a API estavel no app. Isso e pragmatico, mas tem risco real:

- Compilar queries Postgres-only que quebram no SQLite/D1
- Assumir semanticas diferentes (por exemplo, `RETURNING`, JSON ops, etc.)

Mitigacao:

- Preferir o query builder e evitar `sql`...` (lint reforca isso).
- Rodar smokes por dialeto no CI (migracao + seed + asserts).
- Tratar qualquer uso de SQL raw/dialeto-especifico como decisao explicitamente revisada.

### 2) Runtime Edge/Workers

Edge runtime nao suporta drivers Node tradicionais. A regra correta e:

- **Nao acessar DB em middleware/edge** (ou use driver HTTP compativel e seja explicito sobre isso).

Para D1: a inicializacao acontece no Worker (binding `env.DB`), nao dentro do app Next.js.

## Teste minimo (como verificar localmente)

Gates:

```bash
pnpm lint
pnpm type-check
pnpm test
```

SQLite smoke (push + seed + assert):

```bash
TMPDIR="$(mktemp -d)"
export DB_PROVIDER=sqlite
export SQLITE_PATH="$TMPDIR/app.db"

pnpm db:push
pnpm db:seed
pnpm db:assert-seed
```

Postgres smoke (push + seed + assert):

```bash
docker compose up -d postgres

export DB_PROVIDER=postgres
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nextjs

pnpm db:push:pg
pnpm db:seed
pnpm db:assert-seed
```

Build/E2E (determinismo):

```bash
export DB_PROVIDER=postgres
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nextjs
export BETTER_AUTH_SECRET=test-secret-key-for-ci-32-chars-minimum
export NEXT_PUBLIC_APP_URL=http://localhost:3000

pnpm build
pnpm test:e2e:ci
```

## Melhorias futuras (nao implementadas aqui)

- D1 no CI (hoje: D1 e suportado para Workers, mas nao faz parte do pipeline padrao do app Next.js).
- Lints mais agressivos para features PG-only sutis (JSON ops, ARRAYs, etc.) se isso virar necessidade real.

## Referencias (para justificar decisoes especificas)

- Next.js: `useSearchParams` sob `Suspense` para evitar CSR bailout: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
- Tailwind v4 + PostCSS: `@tailwindcss/postcss` e `@import "tailwindcss"`: https://tailwindcss.com/docs/installation/using-postcss
- Playwright `webServer`: https://playwright.dev/docs/test-webserver
- pnpm `approve-builds` / `onlyBuiltDependencies`: https://pnpm.io/cli/approve-builds
