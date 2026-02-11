# API

Este documento descreve os endpoints principais expostos em `app/api/**/route.ts`.

## Convencoes

- **Request correlation**: `x-request-id` e propagado (proxy) e incluido em respostas de erro do wrapper (`src/lib/logging.ts`).
- **Erros**: em geral retornam JSON no formato `{ "error": "mensagem", "requestId": "..." }` (4xx/5xx). O planner tambem expõe `application/problem+json` para casos de rate limit.
- **Cache**: rotas `GET /api/*` enviam `Cache-Control: no-store` via `next.config.ts`.
- **Contrato formal**: endpoint do planner descrito em `docs/openapi.planner.yaml` (OpenAPI 3.1).

## Health

- `GET /health`
- `GET /api/health`

Resposta:

```json
{ "ok": true, "timestamp": "2026-02-07T16:00:00.000Z" }
```

## Metrics (Prometheus)

- `GET /metrics`

Em producao, requer `METRICS_TOKEN` e o header `Authorization: Bearer <token>`.

## Auth (Better Auth)

- `GET|POST /api/auth/*` (catch-all em `app/api/auth/[...all]/route.ts`)

Obs.: endpoints e payloads dependem da configuracao do Better Auth em `src/lib/auth.ts`.

## Workspaces (multi-tenancy)

- `GET|POST /api/workspaces`
- `GET|PATCH|DELETE /api/workspaces/:id`
- `GET|POST /api/workspaces/:id/members`
- `GET|POST /api/workspaces/:id/invitations`

Todas as rotas exigem autenticacao e aplicam validacao com Zod.

## Invitations

- `GET /api/invitations/accept?token=...` (validacao da invite)
- `POST /api/invitations/accept` `{ token }` (aceita a invite)

## Files (storage)

- `GET /api/files/*` (catch-all em `app/api/files/[...key]/route.ts`)

Serve arquivos armazenados via provider configurado.

## Users

- `POST /api/users/avatar` (upload do avatar do usuario autenticado)

## Planner

- `POST /api/planner/generate`

Payload (exemplo resumido):

```json
{
  "locale": "pt-BR",
  "preferences": {
    "data_ida": "2026-08-15",
    "data_volta": "2026-08-25",
    "origens": "GRU",
    "destinos": "LIS, MAD",
    "num_adultos": 2,
    "...": "demais campos seguem o schema do planner"
  }
}
```

Notas:

- Requer sessao autenticada.
- Aplica rate limit por usuario autenticado.
- Resposta de sucesso (versionada):  
  `{ "schemaVersion": "2026-02-11", "generatedAt": "ISO-8601", "report": { ... }, "mode": "ai|fallback" }`.
- Sem chave de IA, o endpoint continua funcional em `mode: "fallback"` com plano resiliente.
- Em rate limit, retorna `429` com `Retry-After` e `application/problem+json`:

```json
{
  "type": "https://guiademilhas.app/problems/planner-rate-limit",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded for planner generation. Retry after the informed interval.",
  "instance": "/api/planner/generate",
  "requestId": "req_or_uuid",
  "code": "planner_rate_limited",
  "retryAfterSeconds": 30,
  "error": "Too Many Requests"
}
```

## Stripe

- `POST /api/stripe/checkout`
- `POST /api/stripe/portal`
- `POST /api/stripe/subscription`
- `POST /api/stripe/payment`
- `POST /api/stripe/webhook` (webhook publico; bypass de CSRF no proxy)

## OG Images

- `GET /api/og?title=...` (Node.js runtime)
