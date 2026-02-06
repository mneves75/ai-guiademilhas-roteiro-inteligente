# Critica de Primeiro Principio: Multi-DB (Drizzle) no Next.js

Este documento descreve o que a implementacao esta tentando otimizar, quais invariantes precisam ser verdadeiros para manter o sistema correto, e quais trade-offs foram aceitos conscientemente.

## Problema (em termos concretos)

Um app Next.js App Router importa codigo em momentos diferentes (dev, build, testes, tooling). Se o acesso ao DB tiver efeitos colaterais no import, voce cria falhas nao deterministicas: build quebrando por env faltando, testes quebrando por conexao eager, ou runtime edge tentando carregar dependencias Node.

Queremos um unico codigo-base com:

- Postgres (Node runtime)
- SQLite (dev/CI/local, via `better-sqlite3`)
- Cloudflare D1 (Workers)

Sem fallback silencioso, sem conexao no import, e com tooling que nao "mistura" dialetos por engano.

## Criterios de Sucesso (pass/fail)

1. `DB_PROVIDER` invalido falha imediatamente com erro explicito.
2. Postgres sem `DATABASE_URL` falha no primeiro acesso real ao DB (nao no import).
3. Import/build nunca abre conexao: conexoes so nascem no primeiro uso real do cliente.
4. Migrations/seed funcionam por provider (ou falham com mensagem clara quando o ambiente nao suporta).
5. Lint e typecheck passam em clone limpo (sem depender de artefatos locais).
6. CI valida Postgres e SQLite com `push + seed + assert-seed`.

## Principios (primeiros principios, nao framework lore)

1. **Invariantes explicitos**: env vars sao input nao confiavel. Validar cedo, com erro acionavel.
2. **Sem efeitos colaterais no import**: import e um detalhe de build/test/tooling. Conexao eager e bug.
3. **Falhar perto da causa**: se falta `DATABASE_URL`, o erro deve dizer isso, nao explodir depois num `.query`.
4. **Dialeto vs features**: o runtime deve ser honesto. Tipos podem ser "convenientes", mas o comportamento nao pode mentir.
5. **Superficie minima**: menos abstracoes, menos estados invalidos. Um caminho feliz simples vale mais que um framework interno.

## Padrao industria (o que normalmente funciona em producao)

### 1) Selecao explicita de dialeto + drivers por runtime

- Um "switch" pequeno e explicito para escolher driver por provider.
- Edge e Node sao ambientes diferentes: edge precisa de driver HTTP/edge-compatible; Node pode usar driver nativo.
- Workers (D1) sao outro mundo: inicializacao via binding `env.DB`, nao via env var do app Next.

### 2) Inicializacao tardia (lazy init) + cache de singleton

- Importar o modulo nunca conecta.
- O singleton nasce no primeiro uso real, e fica cacheado (por processo) para evitar reconnects em dev/HMR.

### 3) Tooling isolado por provider (migrations/seed)

- Configs separadas (ou um config dinamico) para o drizzle-kit, para evitar:
  - rodar schema Postgres contra SQLite
  - gerar migrations no lugar errado
  - "funcionar" local e corromper no CI/prod

### 4) Guardrails de portabilidade

- Bloquear SQL raw na base do app (lint) reduz o risco de drift pra features Postgres-only.
- Smokes por dialeto no CI (migracao + seed + assert) pegam regressao cedo e barato.

## O que foi implementado aqui (estado atual, verificavel)

- **Validacao fail-fast de provider**: `DB_PROVIDER` aceito apenas `postgres | sqlite | d1`.
- **Lazy init**: `db` e `dbEdge` sao proxys; conexao e criada no primeiro acesso.
- **Drivers por runtime**:
  - Node Postgres: `postgres.js` + Drizzle
  - Edge Postgres: Neon HTTP driver + Drizzle
  - SQLite: `better-sqlite3` carregado apenas quando selecionado
- **D1**: protegido com erro explicito dentro do app Next; uso correto e via Worker binding.
- **Tooling por provider (drizzle-kit)**:
  - `drizzle.config.ts` resolve via `DB_PROVIDER`
  - configs explicitas existem para usos diretos
- **CI smokes**: workflows rodam `push + seed + assert-seed` em Postgres e SQLite.
- **Portabilidade**: ESLint bloqueia `sql``...`` e `import { sql } from 'drizzle-orm'` no codigo do app.
- **Portabilidade (runtime)**: `pnpm db:portability-check` roda um conjunto pequeno de operacoes (insert/update/select) em Postgres e SQLite e e executado nos smokes do CI.
- **Paridade de schema**: `pnpm db:schema-parity` falha se Postgres e SQLite divergirem em nome de tabela ou colunas (sem precisar de DB).

## Trade-offs (o que esta "caro" e por que aceitavel)

### 1) Cast de tipo entre dialetos

O cliente exportado usa Postgres como superficie canonica de tipos e faz cast para manter a API estavel no app.

Risco real:

- compilar query Postgres-only e quebrar no SQLite/D1
- assumir semanticas diferentes (ex: `RETURNING`, JSON ops, arrays)

Mitigacao (o que evita regressao na pratica):

- preferir query builder e evitar SQL raw (lint reforca)
- smokes por dialeto no CI (migracao + seed + asserts)
- tratar qualquer uso dialeto-especifico como decisao explicitamente revisada (nao "surgir" por acaso)

### 2) Divergencia de schemas (pg vs sqlite)

Quando voce tem dois schemas distintos (pg e sqlite), existe o risco de:

- adicionar coluna em um e esquecer no outro
- drift de constraints/indices

Mitigacao:

- gerar/push migrations por provider no CI
- seed assertions (contagens) garantem que o "baseline" nao quebrou

### 3) Typed Routes / distDir (armadilha de tooling)

Next.js gera tipos de rotas em `<distDir>/types/routes.d.ts` e atualiza `next-env.d.ts` para importar esse arquivo. Se voce muda `distDir` (ex: em E2E), o `next-env.d.ts` muda junto. Isso e ruido e pode quebrar o repo quando o arquivo entra no git por engano.

Regra pratica:

- nao sobrescrever `NEXT_DIST_DIR` no fluxo normal de E2E local
- manter `next-env.d.ts` apontando para `./.next/types/routes.d.ts`

## Teste minimo (como verificar localmente)

Gates:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm test:e2e:ci
```

SQLite smoke (push + seed + assert):

```bash
TMPDIR="$(mktemp -d)"
export DB_PROVIDER=sqlite
export SQLITE_PATH="$TMPDIR/app.db"

pnpm db:push
pnpm db:seed
pnpm db:assert-seed
pnpm db:portability-check
```

Postgres smoke (push + seed + assert):

```bash
docker compose up -d postgres

export DB_PROVIDER=postgres
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nextjs

pnpm db:push:pg
pnpm db:seed
pnpm db:assert-seed
pnpm db:portability-check
```

## O que eu faria melhor (prioridade por impacto/risco)

1. **Env validation tipada mais ampla**: hoje DB vars criticas ja falham com mensagens consistentes; o proximo passo e aplicar o mesmo padrao para outros subsistemas (auth/email/stripe) sem reintroduzir efeitos colaterais no import.
2. **Suite de portabilidade expandida**: hoje existe `db:portability-check`; o proximo passo e cobrir operacoes usadas em producao (ex: `onConflictDoNothing()` em webhooks) e invariantes de schema (paridade pg/sqlite).
3. **Reducao da mentira de tipos**:
   - expor uma interface minima (subset) em vez de tipar tudo como Postgres, ou
   - criar boundaries onde o cast e permitido e revisar usos Postgres-only conscientemente.
4. **D1 separado por projeto/target**: manter o codigo de D1 (Workers) como um "target" separado, com testes em wrangler, em vez de fingir que o app Next consegue rodar D1 local.

## Referencias (o que guiou as decisoes)

- Next.js TypeScript e `next-env.d.ts` (geracao automatica) e `next typegen`/typed routes:
  - https://nextjs.org/docs/app/api-reference/config/typescript
  - https://nextjs.org/docs/app/building-your-application/configuring/typescript
- Playwright `webServer` (start do server antes dos testes): https://playwright.dev/docs/test-webserver
- Drizzle:
  - Neon HTTP (`drizzle-orm/neon-http`): https://orm.drizzle.team/docs/connect-neon
  - Cloudflare D1 (Workers): https://orm.drizzle.team/docs/connect-cloudflare-d1
  - D1 HTTP API com drizzle-kit (`driver: 'd1-http'`): https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
- pnpm `approve-builds` / `onlyBuiltDependencies` (deps nativas como `better-sqlite3`): https://pnpm.io/cli/approve-builds
- Env validation (padrao de mercado em apps TS/Next): T3 Env + Zod
  - https://env.t3.gg/docs/introduction
  - https://create.t3.gg/en/usage/env-variables
