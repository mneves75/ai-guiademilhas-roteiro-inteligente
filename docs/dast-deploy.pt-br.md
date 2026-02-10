# DAST-lite em ambientes reais (preview/prod)

O repo tem um conjunto de checks DAST-lite (headers, cache, CSP, redirects) implementado em Playwright:

- `e2e/security-headers.e2e.ts` (tag `@dast`)

## Objetivo

Rodar os checks **contra a URL real do deploy**, sem depender do ambiente local, para evitar regressao de headers/caching/CSP em producao.

## Modos suportados

### 1) Automatico em deploy (GitHub `deployment_status`)

Workflow: `.github/workflows/dast-on-deploy.yml`

Ele dispara quando o GitHub recebe um `deployment_status` com `state=success` e tenta resolver a URL via:

1. `deployment_status.target_url`
2. `deployment_status.environment_url`

Se ambos estiverem vazios, o workflow falha com uma mensagem de configuracao.

**Como fazer o GitHub receber deployment_status com URL**

- Em geral, isso vem da integracao do seu provedor de deploy com o GitHub (ex: Vercel/GitHub App).
- Garanta que a integracao esteja habilitada para o repo e que ela publique “Deployment” e “Deployment status” (com URL).
- Referencia (payload): https://docs.github.com/en/webhooks/webhook-events-and-payloads#deployment_status

### 2) Manual (workflow_dispatch)

Workflow: `.github/workflows/dast.yml`

Executa DAST-lite apontando para uma URL fornecida manualmente.

### 3) Local, mas externo (black-box)

Sem GitHub Actions, voce pode rodar no seu terminal contra uma URL:

```bash
PW_EXTERNAL=1 PLAYWRIGHT_BASE_URL='https://sua-url' pnpm exec playwright test --project=chromium --grep @dast
```

Opcionalmente, para checks stateful (cria usuario via signup), em um ambiente descartavel:

```bash
PW_EXTERNAL=1 PW_ALLOW_STATEFUL_DAST=1 PLAYWRIGHT_BASE_URL='https://sua-url' pnpm exec playwright test --project=chromium --grep @dast
```
