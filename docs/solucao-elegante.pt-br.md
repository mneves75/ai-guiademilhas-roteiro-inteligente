# Solucao Elegante: Auth Estavel + E2E Deterministico (Next.js App Router)

Atualizado: 2026-02-09

## Contexto

O problema observado era flakiness no fluxo de auth em E2E (campos "obrigatorios" apesar de preenchidos). O sintoma indicava submit com payload vazio ou valores apagados logo antes do submit.

Isso e uma classe de bug: **estado de UI dependente de comportamento temporal** (hidratar/remount) em vez de invariaveis arquiteturais.

## Principios (primeiros principios)

1. **Invariavel > timing**: um formulario so e confiavel se o estado preenchido nao puder ser "perdido" por re-render/remount entre o fill e o submit.
2. **Parse de query nao pertence ao client**: `callbackUrl`, `token` e similares sao entrada nao confiavel; devem ser normalizados no server e tratados como dados, nao como dependencia de hidratacao.
3. **Sem estados intermediarios**: locale e parametros de URL devem existir no primeiro render (Server Component), nao "corrigidos depois" via `useEffect`.
4. **Validacao deterministica**: nao depender de tooltip HTML5 para validacao (varia por browser/locale); preferir `noValidate` + mensagens por-campo controladas.
5. **Nao vazar mensagens internas**: erro cru tipo `[body.email] ...` nao deve aparecer na UI.
6. **Testes nao devem exigir codigo de producao ad-hoc**: inserir marcadores de hidratacao ou flags runtime para satisfazer E2E e acoplamento e cria divida.
7. **Verificabilidade operacional**: para "10/10", alem de unit/e2e, precisa existir alguma verificacao de runtime (DAST-lite) e evidencias (gates verdes) no pipeline local.
8. **Fail-fast em prod**: configuracao critica deve quebrar cedo e com mensagem objetiva; nao pode virar 500 intermitente em runtime.

## Pesquisa (padrao de industria)

- Next.js documenta que ler search params via `useSearchParams()` sem `Suspense` opta a pagina inteira para CSR (CSR bailout). A recomendacao pratica e isolar em subtree pequeno com `Suspense` ou evitar no topo da pagina:
  - https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
- Next.js recomenda `output: 'standalone'` para deploys self-hosted/Docker e descreve o formato de saida (`.next/standalone/server.js` + assets em `.next/static` + `public/`):
  - https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- OWASP recomenda respostas genericas para evitar enumeracao (login/reset e tambem considerar signup):
  - https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- CSP "strict" (nonce + `strict-dynamic`) e uma abordagem moderna para mitigar XSS com menos allowlists:
  - https://web.dev/articles/strict-csp
- HSTS deve ser emitido apenas em HTTPS/producoes:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
- `security.txt` tem especificacao formal (campos, registry e requisitos como `Contact:`) via RFC 9116:
  - https://www.rfc-editor.org/rfc/rfc9116

## Solucao (scrap + rebuild)

### 1) Refatoracao estrutural (remove a causa raiz)

Padrao aplicado: **Server wrapper + Client form**

- Server Component:
  - le `searchParams: Promise<...>` e faz `await`
  - normaliza `callbackUrl` (anti open-redirect) no server
  - passa `callbackUrl`/`token` como props para o client
- Client Component:
  - apenas UI, estado local e submit
  - nao depende de `useSearchParams()` e nao precisa de `Suspense` para query

Arquivos:

- `app/(auth)/signup/page.tsx` + `app/(auth)/signup/signup-form.tsx`
- `app/(auth)/login/page.tsx` + `app/(auth)/login/login-form.tsx`
- `app/(auth)/reset-password/page.tsx` + `app/(auth)/reset-password/reset-password-form.tsx`
- `app/(auth)/forgot-password/page.tsx` + `app/(auth)/forgot-password/forgot-password-form.tsx`

Notas:

- `initialLocale` vem do server (cookie) e entra como prop; nao existe "flash" de idioma.
- Formularios usam `noValidate` e validacao controlada; erros aparecem por campo com `aria-*`.

### 1.1) Erros de auth (sem vazamento + testavel)

- Parser de erros compactos para erros por campo: `src/lib/auth/error-utils.ts`
- Mapeamento de erros do Better Auth (code/message) para UI: `src/lib/auth/ui-errors.ts`
- Unit tests:
  - `src/lib/__tests__/auth-error-utils.vitest.ts`
  - `src/lib/__tests__/auth-ui-errors.vitest.ts`

### 2) E2E deterministico (sem heuristica)

- Helper para signup deterministico: `e2e/helpers/auth.ts`
- Teste de rotas protegidas sem retries/sleeps: `e2e/protected.e2e.ts`

### 3) DAST-lite (headers em runtime)

Adicionado um conjunto de checks simples e efetivos via Playwright:

- baseline headers em `/`
- `Cache-Control: no-store` em `/api/*`
- paginas protegidas com CSP estrita nonce-based + `no-store`
- `/.well-known/security.txt` (RFC 9116) publicado sem placeholders + campos obrigatorios
  - Em producao (origem publica), o app exige `https://` e exige `SECURITY_CONTACT_EMAIL`/`SECURITY_CONTACT_URL` (fail-fast).

Arquivos:

- `e2e/security-headers.e2e.ts`
- `e2e/security-txt.e2e.ts`

### 4) Consistencia de idioma (pt-BR/en)

Removidas strings hardcoded em auth; centralizadas em `src/lib/messages.ts`.

## Evidencia (gates)

Gates executados e verdes:

- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm build`
- `pnpm audit --prod`
- `gitleaks git --redact`
- `PW_FULL=1 pnpm test:e2e` (matriz completa)
- `pnpm security:audit` (1 comando para audit local + gates + DAST-lite)

## Invariantes de prod (config)

- Validador central: `src/lib/security/prod-config.ts`
- Cobertura: `src/lib/__tests__/prod-config.vitest.ts`

## O que falta para 10/10 absoluto

1. DAST real contra preview/prod (onde CDN/proxy mexe em headers/cookies).
2. Observabilidade/alertas de abuso (picos 401/403/429, falhas de webhook, correlacao via `x-request-id`).
3. Checklist ASVS versionado (IDs + evidencia por controle) como criterio de release.

## Anti-padroes (explicitamente evitados)

- colocar `data-hydrated`/flags runtime apenas para E2E
- aumentar `retries` globalmente para mascarar flakiness
- sincronizar E2E com `waitForTimeout()` como estrategia primaria
