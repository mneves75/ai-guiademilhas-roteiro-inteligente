# OWASP ASVS (Checklist Versionado) - Next.js 16 / React 19

Atualizado: 2026-02-11

Objetivo: manter um baseline ASVS auditavel com evidencia de codigo + validacao reproduzivel.

Nota: isto nao e certificacao ASVS completa. E um gate pragmatico para release.

## V1: Arquitetura, Design e Modelo de Ameacas

- V1.1 (Modelo de ameacas)
  - Evidencia: `relatorio_seguranca.pt-br.md`
  - Status: implementado

## V2: Autenticacao

- V2.x (Fluxos de auth)
  - Evidencia: `app/api/auth/[...all]/route.ts`, `src/lib/auth.ts`
  - Validacao: `e2e/protected.e2e.ts`
  - Status: implementado

- V2.2 (Rate limiting / protecao contra abuso)
  - Evidencia: `proxy.ts`, `src/lib/security/rate-limit.ts`
  - Validacao: testes de rota protegida + metricas em runtime
  - Status: implementado

## V3: Gerenciamento de Sessao

- V3.x (Cookies de sessao e propriedades)
  - Evidencia: `src/lib/auth.ts` (Better Auth), middleware e rotas protegidas
  - Validacao: `e2e/protected.e2e.ts`
  - Status: implementado

## V4: Controle de Acesso

- V4.1 (Authn vs authz)
  - Evidencia: `proxy.ts` (gate de autenticacao), authz no server handlers/RSC
  - Validacao: `e2e/protected.e2e.ts`
  - Status: implementado

- V4.2 (Tenant boundaries / RBAC)
  - Evidencia: rotas `app/api/workspaces/**`, `src/lib/admin.ts`
  - Validacao: `src/lib/__tests__/admin.vitest.ts`
  - Status: implementado

## V5: Validacao, Sanitizacao e Encoding

- V5.3 (Open redirect / callback URL)
  - Evidencia: `src/lib/security/redirect.ts`
  - Validacao: `src/lib/__tests__/security-redirect.vitest.ts`
  - Status: implementado

- V5.1/V5.2 (Entrada nao confiavel)
  - Evidencia: schemas Zod em handlers e rotas sensiveis
  - Validacao: testes unitarios + E2E
  - Status: implementado

## V7: Erros e Logging (Observabilidade)

- V7.1 (Correlacao por request id)
  - Evidencia: `proxy.ts` injeta `x-request-id`
  - Validacao: `e2e/security-headers.e2e.ts`
  - Status: implementado

- V7.2 (Metricas para anomalias)
  - Evidencia: `src/lib/metrics.ts`, `app/metrics/route.ts`
  - Validacao: endpoint `/metrics` e suites E2E
  - Status: implementado

## V9: Comunicacao

- V9.x (TLS/HSTS)
  - Evidencia: politica definida em docs e exigida no deploy
  - Validacao: DAST em ambiente real via `.github/workflows/dast-on-deploy.yml` (depende da integracao de deploy publicar `deployment_status` com URL)
  - Status: parcialmente implementado (depende de infra)

## V12: Seguranca de Arquivos

- V12.1 (Path traversal)
  - Evidencia: `src/lib/storage/local.ts`, `app/api/files/[...key]/route.ts`
  - Validacao: `src/lib/__tests__/storage-local.vitest.ts`
  - Status: implementado

## V14: Configuracao

- V14.4 (Security headers baseline)
  - Evidencia: `next.config.ts`, `app/.well-known/security.txt/route.ts`
  - Validacao: `e2e/security-headers.e2e.ts`, `e2e/security-txt.e2e.ts`
  - Status: implementado

- V14.6 (Secret scanning)
  - Evidencia: `.github/workflows/secret-scan.yml`
  - Validacao: gitleaks local/CI
  - Status: implementado

## Criterio de release

Um release so e considerado pronto quando TODOS abaixo estiverem verdes:

1. `pnpm security:asvs-check`
2. `pnpm security:audit`
3. `pnpm verify:ci`

Esse criterio garante:

- checklist versionado presente e consistente;
- evidencias referenciadas existentes no repo;
- regressao funcional e de seguranca validada por gate executavel.
