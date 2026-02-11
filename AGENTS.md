# Diretrizes Para Agentes (AGENTS.md)

Este repositório é um app Next.js (App Router) com TypeScript em modo estrito, testes unitários com Vitest e E2E com Playwright. O objetivo deste arquivo é reduzir ambiguidade e manter mudanças seguras, pequenas e verificáveis.

## Prioridade (Conflitos)

- Segurança sempre vence: siga a seção **Segurança (Obrigatório)** e `SECURITY.md` primeiro.
- Em seguida, siga este `AGENTS.md`.
- Depois, siga `README.md`, `DEVELOPMENT.md` e `docs/` relevantes.

## Estrutura Do Projeto

- `app/`: Rotas do App Router, layouts, route groups como `(auth)` e `(protected)`, e endpoints em `app/api/**`.
- `src/`: Código compartilhado.
- `proxy.ts`: Pipeline de requests (headers de seguranca, rate limiting, request id, hardening). Nao reintroduzir `middleware.ts`.
- `src/components/`: Componentes de UI.
- `src/lib/`: Lógica de domínio (auth, Stripe, storage, utilitários, etc).
- `src/db/`: Drizzle (schema, seed, checks de portabilidade/paridade).
- `src/emails/`: Templates de email.
- `content/blog/`: Posts MDX com frontmatter.
- `public/`: Assets estáticos.
- `e2e/`: Testes E2E do Playwright (`*.e2e.ts`).
- `src/lib/__tests__/`: Testes unitários do Vitest (`*.vitest.ts`).
- `scripts/`: Scripts operacionais (standalone start, readiness, smoke tests de DB).
- `docs/` e `grafana/`: Documentação e observabilidade local.
- `instrumentation.ts`, `app/health/`, `app/metrics/`: Instrumentação/health/metrics (quando presentes).

## Comandos (pnpm)

Use `pnpm` (lockfile e scripts assumem pnpm).

- `pnpm dev`: servidor de dev (`http://localhost:3000`).
- `pnpm build`: build de produção.
- `pnpm start`: inicia o server de produção (usa `scripts/start-standalone.mjs`).
- `pnpm lint`: ESLint (zero warnings).
- `pnpm type-check`: geração de tipos de rotas + `tsc --noEmit`.
- `pnpm format` e `pnpm format:check`: Prettier.
- `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`: Vitest.
- `pnpm test:e2e`: Playwright (projetos padrão).
- `pnpm test:e2e:ui`: Playwright UI mode.
- `pnpm test:e2e:ci`: Playwright apenas Chromium (mais rápido).
- `PW_FULL=1 pnpm test:e2e`: matriz cross-browser completa (inclui Firefox/WebKit e mobile).
- `pnpm security:audit`: gate local de seguranca (auditoria + checks do repo).
- `pnpm verify`: gate local (lint + type-check + unit + build + smoke DB + e2e chromium).

## Padrões De Código

- TypeScript estrito: evite `any`. Prefira `unknown` + type guards.
- Formatação: 2 espaços, aspas simples, `;`, largura 100 (Prettier).
- Nomes: `camelCase` (variáveis/funções), `PascalCase` (componentes/tipos).
- Next.js: prefira Server Components; use `'use client'` apenas quando necessário.
- `searchParams`: prefira ler no Server Component (`searchParams: Promise<...>`) e passar como prop para Client Components. Evite `useSearchParams()` no topo da página para não induzir CSR bailout e reduzir riscos de hidratação/flakiness. Se precisar de `useSearchParams()`, isole em um componente pequeno e envolva em `Suspense`.
- Imports: use o alias `@/` para `src/`.
- Não introduza dependências novas sem motivo claro e sem evidência (build/test) de que valeu a pena.

## Testes (Regras Práticas)

- Unit (Vitest): `src/lib/__tests__/*.vitest.ts`.
- E2E (Playwright): `e2e/*.e2e.ts`.
- Se o teste é sobre UI, use `getByRole/getByLabel` e `expect()` em vez de timeouts.
- Se precisar de seletores estáveis, prefira `data-testid` estático (evite lógica de runtime só para testes).
- Não aumente `retries` globalmente para mascarar flakiness; conserte a causa (esperas corretas, asserts, seletor estável).

## Banco De Dados (Drizzle)

- Sincronização/migração: `pnpm db:push`, `pnpm db:migrate`.
- Seed e checks: `pnpm db:seed`, `pnpm db:assert-seed`, `pnpm db:portability-check`, `pnpm db:schema-parity`.
- Smoke tests: `pnpm db:smoke` (e variantes).
- Providers via env: `DB_PROVIDER=postgres|sqlite|d1` (veja `.env.example`).

## Segurança (Obrigatório)

- Nunca commitar `.env.local` nem segredos. Use `.env.example` apenas com placeholders.
- Dependências: `pnpm audit --prod` deve ficar limpo.
- Mudancas em auth, `proxy.ts`, headers, redirects/callbacks ou endpoints criticos devem rodar tambem `pnpm security:audit`.
- Secret scanning: o CI usa Gitleaks em modo `git` (histórico completo). Para checar localmente:
  - `gitleaks git --redact --report-format sarif --report-path gitleaks.sarif`
  - Opcional (pré-commit): `gitleaks protect --staged --redact`
- Métricas: `/metrics` (Prometheus). Em produção requer `METRICS_TOKEN` (Bearer). Veja `app/metrics/route.ts`.
- Redirecionamentos/callbacks: preserve validações (ex.: normalização de `callbackUrl`) e não introduza open-redirect.
- Autenticação/rate limiting: não desabilitar em produção; qualquer exceção precisa ser explicitamente restrita a ambiente de teste/local.

## PRs E Commits

- Mensagens e títulos: Conventional Commits (ex.: `feat(blog): ...`).
- Antes de pedir review: rode pelo menos `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build` e o E2E relevante.
- UI: inclua screenshots ou passos claros de validação quando aplicável.

## Prompt (Carmack/Ultrawork)

- Versão recomendada do prompt (pt-BR): `docs/prompt-ultrawork-10-10.pt-br.md`.
