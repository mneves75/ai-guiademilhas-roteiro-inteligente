# Critica de Primeiro Principio: Multi-DB (Drizzle) no Next.js

Este documento descreve o que esta implementacao esta tentando otimizar, os trade-offs assumidos, e quais invariantes precisam ser verdadeiros para manter o sistema correto e previsivel.

## Objetivo

Ter um unico codigo-base que funcione com:

- Postgres (Node runtime)
- SQLite (dev/CI/local, via `better-sqlite3`)
- Cloudflare D1 (Workers)

Sem quebrar `next build`, sem "fallback silencioso", e com uma API de acesso a DB coerente para o app.

## Criterios de Sucesso (pass/fail)

1. `DB_PROVIDER` invalido falha imediatamente com erro explicito.
2. Postgres sem `DATABASE_URL` falha no primeiro acesso real ao DB (nao no import).
3. `next build` nao depende de DB configurado, e nao inicializa conexoes no import.
4. Seed e migracoes funcionam por provider (ou falham com mensagem clara quando nao suportado no ambiente).
5. Linters e typecheck passam em clone limpo (sem depender de `.next/*`).

## Principios (primeiros principios, nao "framework lore")

1. **Invariantes explicitos**: variaveis de ambiente sao input nao confiavel. Validar cedo e com mensagens acionaveis.
2. **Sem efeitos colaterais no import**: no App Router, imports acontecem em build, em testes, e em tooling. Conexao eager e bug.
3. **Falhar perto da causa**: se o problema e `DATABASE_URL` faltando, o erro deve citar isso diretamente, nao explodir mais tarde em uma query.
4. **Separar "dialeto" de "features"**: o tipo pode mentir, mas o runtime nao. Se voce compila SQL Postgres-only e roda no SQLite, vai quebrar.
5. **Manter a superficie minima**: cada camada extra de abstracao vira um lugar novo para estados invalidos viverem.

## O que foi implementado (o "padrao industria" na pratica)

- **Validacao fail-fast de provider**: `DB_PROVIDER` e limitado a um conjunto conhecido. Typos quebram imediatamente.
- **Lazy init**: `db` e criado sob demanda (primeiro acesso). Isso elimina falhas de build por env faltando.
- **Mensagens de erro orientadas a acao**: erros citam a variavel faltando e o provider em uso.
- **Configuracoes separadas de drizzle-kit**: scripts e configs por provider evitam "migracao certa com config errada".

Esses pontos seguem o padrao que aparece em projetos grandes: validacao de config, inicializacao tardia, e tooling isolado por ambiente/dialeto.

## Trade-offs (o que esta "caro" e por que aceitavel)

### 1) Cast de tipo entre dialetos

Mentir para o TypeScript pode ser pragmatico se a API for estruturalmente identica, mas aumenta o risco de:

- Compilar queries PG-specific que quebram no SQLite/D1
- Assumir semanticas diferentes (por exemplo, `RETURNING`, JSON ops, etc.)

Mitigacao: manter queries portaveis, e adicionar testes por dialeto quando o projeto crescer.

### 2) Runtime Edge/Workers

Edge runtime nao suporta drivers Node tradicionais. A regra correta e simples:

- **Nao acessar DB em middleware/edge** (ou use um driver HTTP compativel e seja explicito sobre isso).

## Teste minimo (como verificar localmente)

Os comandos abaixo sao os "gates":

```bash
pnpm lint
pnpm type-check
pnpm test

DB_PROVIDER=sqlite SQLITE_PATH=:memory: \
  BETTER_AUTH_SECRET=devsecretdevsecretdevsecretdevsecret \
  BETTER_AUTH_URL=http://localhost:3000 \
  NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  pnpm build

CI=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
  DB_PROVIDER=sqlite SQLITE_PATH=:memory: \
  BETTER_AUTH_SECRET=devsecretdevsecretdevsecretdevsecret \
  BETTER_AUTH_URL=http://localhost:3000 \
  NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  pnpm test:e2e:ci
```

## Melhorias futuras (nao implementadas aqui)

- Matriz de CI por provider (postgres + sqlite + d1)
- Suite de integracao que roda o mesmo conjunto de queries em cada dialeto
- Regras/lints para detectar uso de features PG-only em codigo que precisa ser portavel

## Referencias (para justificar decisoes especificas)

- Next.js: `useSearchParams` deve ficar sob `Suspense` para evitar CSR bailout: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
- Tailwind v4 + PostCSS: `@tailwindcss/postcss` e `@import "tailwindcss"`: https://tailwindcss.com/docs/installation/using-postcss
- Playwright `webServer` (start server antes dos testes): https://playwright.dev/docs/test-webserver
- pnpm `approve-builds` / `onlyBuiltDependencies` (permitir builds nativos sem prompt): https://pnpm.io/cli/approve-builds
