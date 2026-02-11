# OWASP ASVS (Mapeamento Minimo) - Next.js 16 / React 19

Atualizado: 2026-02-09

Objetivo: registrar, de forma auditavel, quais controles ASVS relevantes existem no repo, onde estao no codigo e como validar.

Nota: isto nao e uma certificacao ASVS completa. E um baseline pragmatico para reduzir risco e guiar revisoes.

## V1: Arquitetura, Design e Modelo de Ameacas

- V1.1 (Modelo de ameacas)
  - Evidencia: `relatorio_seguranca.pt-br.md` (trust boundaries + ativos + atacantes)

## V2: Autenticacao

- V2.x (Fluxos de auth)
  - Evidencia: `app/api/auth/[...all]/route.ts`, `src/lib/auth.ts`, `src/lib/auth-client.ts`
  - Validacao: `e2e/protected.e2e.ts` (signup + acesso a rota protegida)

- V2.2 (Rate limiting / protecao contra abuso de auth)
  - Evidencia: `proxy.ts` (rate limit em `/api/auth` POST), `src/lib/security/rate-limit.ts`
  - Validacao: teste manual (429) ou metricas (ver V7)

## V3: Gerenciamento de Sessao

- V3.x (Cookies de sessao e propriedades)
  - Evidencia: Better Auth (config em `src/lib/auth.ts`)
  - Validacao: inspeccionar cookies no browser e verificar `HttpOnly/SameSite/Secure` conforme ambiente

## V4: Controle de Acesso

- V4.1 (Separacao de authn vs authz)
  - Evidencia: `proxy.ts` faz apenas "tem cookie?" para paginas; authz real fica nos handlers/RSC.
  - Validacao: E2E `e2e/protected.e2e.ts` (redirect para `/login` quando nao autenticado)

- V4.2 (Multi-tenant / RBAC)
  - Evidencia: rotas em `app/api/workspaces/**`, `src/lib/admin.ts` e queries em `src/db/**` (ver logica de membership/owner)
  - Validacao: testes unitarios existentes em `src/lib/__tests__/admin.vitest.ts` (quando aplicavel)

## V5: Validacao, Sanitizacao e Encoding

- V5.3 (Open redirect / callback URL)
  - Evidencia: `src/lib/security/redirect.ts`, uso em `app/(auth)/login/page.tsx` e `app/(auth)/signup/page.tsx`
  - Validacao: unit `src/lib/__tests__/security-redirect.vitest.ts`

- V5.1/V5.2 (Entrada nao confiavel em handlers)
  - Evidencia: uso de Zod/validacao em handlers relevantes (ex.: convites, workspaces, stripe)
  - Validacao: testes unitarios + E2E

## V7: Erros e Logging (Observabilidade)

- V7.1 (Correlacao por request id)
  - Evidencia: `proxy.ts` injeta `x-request-id` em responses
  - Validacao: `e2e/security-headers.e2e.ts` verifica header em `/`

- V7.2 (Metricas para anomalias/abuso)
  - Evidencia: `src/lib/metrics.ts`, endpoint `app/metrics/route.ts`, contadores custom em `proxy.ts`
  - Validacao: acessar `/metrics` (dev) e observar series `app_*`

## V9: Comunicacao

- V9.x (TLS)
  - Fora do escopo do app code: depende do deploy (CDN/proxy). Exigir HTTPS e HSTS e decisao de infra.

## V12: Seguranca de Arquivos

- V12.1 (Path traversal / chaves de storage)
  - Evidencia: `src/lib/storage/local.ts` + restricoes em `app/api/files/[...key]/route.ts`
  - Validacao: unit `src/lib/__tests__/storage-local.vitest.ts`

## V14: Configuracao

- V14.4 (Security headers baseline)
  - Evidencia: `next.config.ts` (headers globais)
  - Validacao: `e2e/security-headers.e2e.ts`

- V14.6 (Secret scanning)
  - Evidencia: `.github/workflows/secret-scan.yml`, comando local em `AGENTS.md`
  - Validacao: `gitleaks git --redact --report-format sarif --report-path gitleaks.sarif`
