# Arquitetura

Este projeto e uma aplicacao Next.js 16 (App Router) com React 19 e TypeScript em modo strict.
O foco e ter um "demo app" completo (auth, multi-tenancy, billing, admin, blog) com gates de qualidade e um caminho de deploy simples (Docker + `output: 'standalone'`).

## Estrutura (alto nivel)

- `app/`: rotas do App Router (RSC por padrao), route groups `(auth)` e `(protected)`, e route handlers em `app/api/**/route.ts`.
- `src/`: codigo compartilhado (UI, lib, db, contexts, emails).
- `content/blog/`: posts MDX com frontmatter.

## Request Pipeline (proxy)

O Next.js 16 deprecou `middleware.ts` neste repo; usamos `proxy.ts`:

- injeta/propaga `x-request-id` para correlacao de logs e respostas;
- aplica hardening basico (ex.: CSRF/cookies), rate-limit em `POST /api/auth/*`;
- aplica CSP com nonce em rotas sensiveis como `/dashboard` e `/admin`.

## API: erros + logs estruturados

Route handlers (`app/api/**/route.ts`) seguem o padrao:

- erros viram excecoes tipadas (`src/lib/http.ts` -> `HttpError`);
- `withApiLogging` (`src/lib/logging.ts`) adiciona logging estruturado (JSON) + requestId;
- payloads JSON sao lidos de forma defensiva (`src/lib/http-body.ts`).

## Autenticacao e Autorizacao

- Better Auth em `src/lib/auth.ts` (server) e `src/lib/auth-client.ts` (client).
- Rotas protegidas usam guard (ex.: layouts em `app/(protected)/**`) e fazem `redirect('/login')` quando nao autenticado.
- Admin e controlado por `ADMIN_EMAILS` (lista separada por virgula).

## Banco de Dados

- Drizzle ORM com multiplos providers (`DB_PROVIDER`): sqlite, postgres e D1.
- Entrypoint: `src/db/client.ts` (validacao de env e criacao de clientes).

## Stripe

- Helpers de Stripe em `src/lib/stripe-helpers.ts` (inclui validacao de metadata e update de assinatura).
- Webhook em `app/api/stripe/webhook/route.ts` (processamento idempotente + marcacao de falhas).

## Storage (uploads)

Abstracao por provider em `src/lib/storage/*` com validacao explicita de env:

- `local` (filesystem)
- `r2` (Cloudflare R2)
- `vercel-blob` (Vercel Blob)

## Health checks

- `GET /health` e `GET /api/health` retornam `{ ok: true, timestamp }`.
