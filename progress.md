# Progresso (Ultrawork)

Data: 2026-02-10

## Objetivo

Scrap + rebuild com invariantes fortes para:

- i18n (pt-BR/en) com URLs publicas estaveis por locale (`/en/*`, `/pt-br/*`) + cookie `httpOnly` como preferencia
- SEO tecnico (robots/sitemap/rss + canonical + hreflang + noindex consistente)
- E2E deterministico (sem flakiness, sem dependencias externas por padrao, matriz completa via PW_FULL)

## Mudancas feitas

- i18n (server-driven):
  - `proxy.ts`: suporte a URLs publicas por locale (`/en/*`, `/pt-br/*`) via rewrite e redirect de rotas legadas sem prefixo.
  - `src/lib/locale-server.ts`: `getRequestLocale()` memoizado por request (`react/cache`), prioriza `x-shipped-locale` do proxy, depois cookie e fallback `Accept-Language`.
  - `src/lib/locale-actions.ts`: Server Action que seta cookie `shipped_locale` `httpOnly` (Secure apenas em HTTPS).
  - `src/contexts/locale-context.tsx`: provider sem estado (locale vem do server).
  - `src/components/language-switcher.tsx`: troca de idioma navega entre URLs publicas por locale e persiste preferencia via cookie; guard de hidratacao para evitar cliques antes do JS.
  - `src/lib/messages.ts`: centralizacao de strings + correcao de hardcode (`common.and`).
- SEO tecnico:
  - `src/lib/seo/base-url.ts`: origem canonica unica para URLs publicas (sitemap/robots/rss/metadata).
  - `src/lib/seo/public-alternates.ts`: helper para `canonical` + `hreflang` consistente em paginas publicas.
  - `app/sitemap.ts`: sitemap apenas de paginas publicas + posts; tags entram so se tiverem >= 2 posts (evita thin content); entradas emitidas por locale.
  - `app/robots.ts`: robots.txt minimalista (hint de crawl), sem depender de disallow para noindex.
  - `app/rss.xml/route.ts`: RSS do blog com links canonicos por locale.
  - `app/page.tsx`, `app/pricing/page.tsx`, `app/blog/**`: `canonical` + `hreflang` por locale (sem depender de canonical global).
  - `app/layout.tsx`: RSS discovery e suporte a verificacao (Google/Bing) via env (sem canonical global).
  - `next.config.ts`: `X-Robots-Tag: noindex, nofollow` em `/dashboard/*`, `/admin/*`, `/invite/*`, `/emails/preview`.
- E2E deterministico:
  - `playwright.config.ts`: `dns.setDefaultResultOrder('ipv4first')` (evita flakiness ::1 vs 127.0.0.1).
  - `scripts/test-e2e.mjs`: quando `PW_FULL=1`, faz build/start fora do `webServer` e escolhe porta livre (evita `exit 137` e `EADDRINUSE`).
  - `scripts/normalize-next-env.mjs`: normaliza `next-env.d.ts` apos builds E2E com distDir isolado.
- Testes:
  - `src/lib/__tests__/seo-routes.vitest.ts` (sitemap/robots/rss).
  - `e2e/i18n.e2e.ts` (troca de idioma + persistencia em todos os engines, incluindo WebKit/mobile Safari).
  - `e2e/protected.e2e.ts` (cookie pt-BR em /login + fluxo real de signup, com guard de hidratacao para evitar submit nativo).
  - `e2e/screens.e2e.ts` (smoke amplo de telas publicas + protected em pt-BR, chromium-only).
  - `e2e/home.e2e.ts` (robots/sitemap/rss e `X-Robots-Tag`).
- Docs:
  - `docs/seo-estrategia.pt-br.md` (invariantes + pass/fail + fontes primarias).
  - `docs/solucao-elegante.pt-br.md` (primeiros principios + evidencias).
- Conteudo (cluster inicial):
  - `content/blog/nextjs-saas-boilerplate-10-10.mdx` (pilar)
  - satelites em `content/blog/*.mdx` (multi-tenancy, Stripe, auth, SEO tecnico, E2E, headers)

## Verificacao

- Gates executados (verdes): `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `PW_FULL=1 pnpm test:e2e`.

---

Data: 2026-02-11

## Ultrawork - Planner com IA (framework reused)

### Escopo concluido

- Landing da home mantida como pagina de conversao para o planner (`app/page.tsx` + `src/content/landing.ts`).
- Planner do dashboard migrado de geracao local para fluxo server-side com IA:
  - Novo endpoint autenticado: `POST /api/planner/generate` em `app/api/planner/generate/route.ts`.
  - Novo servico de geracao: `src/lib/planner/generate-report.ts` (AI SDK + Gemini + saida estruturada + fallback resiliente quando IA indisponivel).
  - Novo contrato de validacao: `src/lib/planner/schema.ts` (request + report schema com Zod).
  - Form atualizado para chamar backend e tratar erros/loading/requestId + aviso de fallback: `app/(protected)/dashboard/planner/planner-form.tsx`.
- Rebrand de superficies centrais para Guia de Milhas:
  - `app/layout.tsx`, `app/(auth)/layout.tsx`, `src/components/dashboard-nav.tsx`, `app/blog/layout.tsx`, `app/api/og/route.tsx`, `app/(protected)/dashboard/workspaces/new/page.tsx`, `README.md`.
- E2E ajustado para o novo contrato da landing (copy e acessibilidade):
  - `e2e/home.e2e.ts`, `e2e/i18n.e2e.ts`, `e2e/screens.e2e.ts`.
  - Novo E2E de ponta a ponta do planner: `e2e/planner.e2e.ts` (signup real + submit + relatorio + fallback notice).
  - Helper de auth corrigido para respeitar `callbackUrl`: `e2e/helpers/auth.ts`.
- Contrato de ambiente/documentacao:
  - `.env.example`: variaveis `GOOGLE_GENERATIVE_AI_API_KEY` e `PLANNER_GOOGLE_MODEL`.
  - `docs/API.md`: secao do endpoint do planner.
- Testes adicionados:
  - `src/lib/__tests__/planner-schema.vitest.ts` cobrindo validacao de payload e fallback funcional sem chave AI.

### Verificacao executada

- `pnpm lint` ✅
- `pnpm type-check` ✅
- `pnpm test` ✅ (18 arquivos, 70 testes)
- `pnpm build` ✅
- `pnpm test:e2e:ci` ✅ (31 testes passados)

### Revalidacao final (2026-02-11)

- `PW_FULL=1 pnpm test:e2e` ✅
  - Resultado: `151 passed`, `4 skipped` (matriz completa: chromium, firefox, webkit, mobile-chrome, mobile-safari).
  - Evidencia: `e2e/screens.e2e.ts` e intencionalmente `skip` fora de `chromium` para smoke amplo de telas.
- `pnpm verify` ✅
  - Inclui: `lint`, `type-check`, `test`, `build`, `db:smoke` (sqlite + postgres local) e `test:e2e:ci`.
  - Resultado E2E CI final dentro do verify: `31 passed`.
- `pnpm security:audit` ✅
  - `pnpm audit --prod`: sem vulnerabilidades conhecidas.
  - DAST-lite (`@dast`): `4 passed`.
  - Gates basicos finais: `lint`, `type-check`, `test` verdes.

### Hardening adicional (2026-02-11)

- `scripts/readiness-check.mjs`:
  - Resolucao robusta do path de guidelines (`~/dev/guidelines-ref/...` ou `~/dev/GUIDELINES-REF/...`).
- `scripts/security-audit.sh`:
  - Fluxo de gitleaks endurecido para ambiente sem `.git` com scan por diretorios-fonte (`app`, `src`, `scripts`, `e2e`, `content`, `docs`, `observability`, `public`).
  - Mantem scan bloqueante com `gitleaks git` quando repositorio git existe.
- Revalidacao apos hardening:
  - `pnpm readiness` ✅ (L5, 94.2%).
  - `pnpm security:audit` ✅.
  - `pnpm verify` ✅ (incluindo `db:smoke` e `test:e2e:ci` com `31 passed`).
  - `PW_FULL=1 pnpm test:e2e` ✅ (`151 passed`, `4 skipped`).

### Upgrade 10/10 - Contrato Planner + Reuso de Framework (2026-02-11)

- Contrato da API do planner fortalecido:
  - `app/api/planner/generate/route.ts`:
    - resposta de sucesso versionada com `schemaVersion` + `generatedAt`;
    - rate limit em `application/problem+json` (RFC 9457) com `code`, `instance`, `requestId` e `Retry-After`.
  - `src/lib/planner/api-contract.ts`:
    - contrato compartilhado e parse resiliente para payload v2 e legado.
  - `app/(protected)/dashboard/planner/planner-form.tsx`:
    - parse robusto de sucesso/erro (inclusive problem details) com mensagem orientada por `retryAfterSeconds`.
- Cobertura de testes expandida:
  - `src/lib/__tests__/planner-api-contract.vitest.ts` (novo).
  - `src/lib/__tests__/landing-content.vitest.ts` (novo).
  - `e2e/home.e2e.ts`:
    - validacao de `callbackUrl` nas CTAs de landing para fluxo planner.
  - `e2e/protected.e2e.ts`:
    - redirect de `/dashboard/planner` para `/login?callbackUrl=...`.
- Documentacao atualizada:
  - `docs/API.md` (contrato versionado + `problem+json` no planner).
  - `docs/solucao-elegante.pt-br.md` e `docs/critica-10-10.pt-br.md` (estado novo refletido).
  - `docs/reuso-framework-upstream.pt-br.md` (estrategia de reuso upstream/fork e criterios 10/10).
  - `README.md` (ajuste de onboarding + link para estrategia de reuso).
- Verificacao final desta iteracao:
  - `pnpm test` ✅ (`20 files`, `76 tests`).
  - `PW_FULL=1 pnpm test:e2e` ✅ (`161 passed`, `4 skipped`).
  - `pnpm verify` ✅ (`test:e2e:ci` com `33 passed`).
  - `pnpm security:audit` ✅ (audit limpo + gitleaks por diretorios + DAST-lite `4 passed`).

### Upgrade adicional - Contrato formal e teste de rota (2026-02-11)

- Contrato OpenAPI formalizado:
  - `docs/openapi.planner.yaml` com especificacao OpenAPI 3.1 para `POST /api/planner/generate`.
  - `docs/API.md` atualizado para apontar explicitamente para o contrato OpenAPI.
- Regressao de endpoint coberta em nivel de rota:
  - `src/lib/__tests__/planner-generate-route.vitest.ts` cobre:
    - 401 (`Unauthorized`) sem sessao;
    - 429 `application/problem+json` com `Retry-After`;
    - 200 com payload versionado (`schemaVersion`, `generatedAt`, `report`, `mode`).
- Governanca de release/documentacao:
  - `CHANGELOG.md` (`Unreleased`) atualizado com novo contrato e testes.
- Revalidacao final apos essa rodada:
  - `pnpm test` ✅ (`21 files`, `79 tests`).
  - `pnpm verify` ✅ (`33 passed` em `test:e2e:ci`).
  - `pnpm security:audit` ✅.
  - `PW_FULL=1 pnpm test:e2e` ✅ (`161 passed`, `4 skipped`).

### Revalidacao autonoma final (2026-02-11)

- Atualizacao de consistencia documental:
  - `docs/critica-10-10.pt-br.md` ajustado de `151 passed` para `161 passed` na secao de evidencia E2E.
- Verificacao executada nesta rodada:
  - `PW_FULL=1 pnpm test:e2e` ✅ (`161 passed`, `4 skipped`).
  - `pnpm verify` ✅ (`test:e2e:ci` com `33 passed`; inclui `lint`, `type-check`, `test`, `build`, `db:smoke`).
  - `pnpm security:audit` ✅ (audit sem vulnerabilidades, gitleaks limpo por diretorios, DAST-lite `4 passed`).
- Observacao:
  - Naquele momento, o workspace ainda estava sem `.git`; a rodada seguinte inicializou Git e configurou `upstream`.

### Automacao upstream + validacao final (2026-02-11)

- Reuso de framework operacionalizado:
  - Novo script `scripts/framework-upstream.sh` com comandos `bootstrap`, `status`, `sync`, `sync --verify`.
  - `pnpm framework:bootstrap` executado com sucesso.
  - Remote `upstream` configurado para `~/dev/PROJETOS/nextjs-bootstrapped-shipped`.
  - Branch upstream autodetectada como `master` (fallback automatico quando `main` nao existe).
- Hardening de seguranca:
  - `scripts/security-audit.sh` agora trata repo Git sem commits e cai para scan por diretorios com gitleaks.
- Comandos `pnpm` adicionados:
  - `framework:bootstrap`, `framework:status`, `framework:sync`, `framework:sync:verify`.
- Validacao desta rodada:
  - `pnpm framework:status` ✅
  - `pnpm framework:sync` ✅ falha esperada sem commits locais (mensagem deterministica).
  - `pnpm verify` ✅ (`33 passed` em `test:e2e:ci`).
  - `pnpm security:audit` ✅ (`4 passed` em DAST-lite, sem vulnerabilidades conhecidas, gitleaks limpo).
  - `PW_FULL=1 pnpm test:e2e` ✅ (`161 passed`, `4 skipped`).

### Fechamento estrutural de reuso (2026-02-11)

- Historico Git consolidado para sync real com upstream:
  - Commit inicial criado: `chore(repo): snapshot inicial do produto`.
  - Historico upstream ligado por merge de historicos com estrategia `ours`.
- Resultado operacional:
  - `pnpm framework:status` ✅ (`ahead:2`, `behind:0` vs `upstream/master`).
  - `pnpm framework:sync` ✅ (`Already up to date`).
- Ajuste final de robustez:
  - `scripts/framework-upstream.sh` corrigido para parse correto de `ahead/behind` quando `git rev-list --count` retorna separado por tab.

### Validacao final pos-ancoragem (2026-02-11)

- `pnpm framework:sync:verify` ✅
  - Sync com upstream: `Already up to date`.
  - Verify completo: sucesso (incluindo `test:e2e:ci` com `33 passed`).
- `pnpm security:audit` ✅ apos ancoragem de historico
  - `gitleaks git` executado sobre historico (`119 commits scanned`, sem leaks).
  - DAST-lite: `4 passed`.
- `PW_FULL=1 pnpm test:e2e` ✅ (sequencial)
  - `161 passed`, `4 skipped`, `0 failed`.
- Nota de engenharia:
  - Uma tentativa de executar `security:audit` e E2E full em paralelo gerou corrida no SQLite; rerun sequencial confirmou estabilidade completa.

### Governanca de drift upstream (2026-02-11)

- Evolucao de reuso para operacao continua:
  - `scripts/framework-upstream.sh` agora aceita `FRAMEWORK_UPSTREAM_SOURCE` com caminho local ou URL Git remota.
  - Novo comando `pnpm framework:check` para gate de drift (`behind` maximo via `FRAMEWORK_UPSTREAM_MAX_BEHIND`, default `0`).
  - Novo workflow `.github/workflows/upstream-drift.yml` (diario + manual) para detectar atraso frente ao framework.
- Documentacao atualizada:
  - `README.md` e `docs/reuso-framework-upstream.pt-br.md`.
- Estado:
  - Reuso deixou de depender de path local e agora possui verificacao automatizada em CI.

### Operacao elegante de sync (2026-02-11)

- Melhoria de ergonomia e controle de risco:
  - Novo comando `pnpm framework:preview` para listar commits/arquivos antes do merge.
  - `bootstrap` agora liga `git rerere` para reaproveitar resolucoes de conflito recorrentes.
  - `.github/CODEOWNERS` adicionado para reforcar ownership entre core e dominio.
- Resultado:
  - Fluxo de sync ficou observavel (preview), repetivel (rerere) e governavel (ownership + drift gate).

### Pesquisa + critica 10/10 (2026-02-11)

- Documento tecnico consolidado em pt-BR:
  - `docs/reuso-framework-10-10-carmack.pt-br.md`
  - inclui critica de primeiros principios, abordagem de mercado e lacunas remotas para fechar 10/10 absoluto.
- Evidencia desta rodada:
  - `pnpm framework:bootstrap` (rerere habilitado) ✅
  - `pnpm framework:preview` ✅
  - `pnpm framework:check` ✅
  - `pnpm verify` ✅
  - `pnpm security:audit` ✅
  - `PW_FULL=1 pnpm test:e2e` ✅ (`161 passed`, `4 skipped`)

### Automacao de PR de sync upstream (2026-02-11)

- Workflow novo:
  - `.github/workflows/upstream-sync-pr.yml`
  - agenda semanal + manual
  - executa `bootstrap` + `preview` + `sync`
  - abre PR automatica (`chore/upstream-sync`) quando houver diff
- Objetivo:
  - fechar o loop "detectar drift -> propor correção" sem intervenção manual.

### Hardening do workflow de PR semanal (2026-02-11)

- Ajustes:
  - `.github/workflows/upstream-sync-pr.yml` agora instala dependencias e executa:
    - `framework:check` pos-sync (drift resolvido)
    - `pnpm lint && pnpm test` antes de abrir/atualizar PR
- Efeito:
  - reduz probabilidade de PR automatica com regressao basica.

### Limpeza final do workflow semanal (2026-02-11)

- Ajuste:
  - Remocao de duplicidade de `Setup Node.js` e `Setup pnpm` em `.github/workflows/upstream-sync-pr.yml`.
- Validacao da rodada:
  - `pnpm framework:check` ✅
  - `pnpm verify` ✅
  - `PW_FULL=1 pnpm test:e2e` ✅ (`161 passed`, `4 skipped`)

### Framework doctor + fechamento autonomo (2026-02-11)

- Implementacao:
  - novo comando `pnpm framework:doctor` em `scripts/framework-upstream.sh`.
  - diagnostico de prontidao com checks para:
    - Git inicializado, remote `upstream`, `CODEOWNERS`
    - remote `origin`
    - branch protection no GitHub via `gh` (quando aplicavel)
  - suporte a modo estrito:
    - `FRAMEWORK_DOCTOR_STRICT=1`
    - `FRAMEWORK_DOCTOR_TARGET_BRANCH=<branch>`
- Resultado objetivo:
  - lacuna residual identificada automaticamente: `origin` ausente neste workspace local.
- Evidencia:
  - `pnpm framework:doctor` ✅ (`ok:4 warn:1 fail:0`)
  - `FRAMEWORK_DOCTOR_STRICT=1 pnpm framework:doctor` ❌ esperado (`origin` ausente)
  - `pnpm framework:check` ✅
  - `pnpm verify` ✅
  - `pnpm security:audit` ✅
  - `PW_FULL=1 pnpm test:e2e` ✅ (`161 passed`, `4 skipped`)

### Fechamento autonomo final (2026-02-11)

- Evolucao final:
  - `origin` configurado para `https://github.com/mneves75/ai-guiademilhas-apps.git`.
  - `framework:doctor` refinado para reportar limites externos como `[LIMIT]` (ex.: branch protection indisponivel por plano).
- Verificacao de limite externo:
  - tentativa de aplicar branch protection via API retornou `403`:
    - "Upgrade to GitHub Pro or make this repository public to enable this feature."
  - comportamento final do doctor:
    - `FRAMEWORK_DOCTOR_STRICT=1 pnpm framework:doctor` ✅ com `limit:2` e `fail:0`.
- Evidencia da rodada final:
  - `pnpm framework:check` ✅
  - `pnpm verify` ✅
  - `PW_FULL=1 pnpm test:e2e` ✅ (`161 passed`, `4 skipped`)

### Stabilizacao E2E + branch protection real (2026-02-11)

- Correcoes em `e2e/helpers/auth.ts` para eliminar flake de callback em CI:
  - `callbackPattern` ancorado com fim de URL/query/hash.
  - `Promise.all` em submit/login para evitar race entre click e navegacao.
  - fallback de login mantido para cenarios de signup sem redirect imediato.
- Governanca remota fechada:
  - branch protection aplicada em `main` no repo `mneves75/ai-guiademilhas-roteiro-inteligente` com:
    - `require_code_owner_reviews=true`
    - `required_approving_review_count=1`
    - status checks obrigatorios (`Quality`, `Unit Tests + DB Smokes`, `E2E Tests`, `Build`, `gitleaks`, `Analyze (javascript-typescript)`).
- Evidencia local desta rodada:
  - `pnpm lint` ✅
  - `pnpm type-check` ✅
  - `pnpm test` ✅ (`79 passed`)
  - `pnpm test:e2e` ✅ (`65 passed`, `1 skipped`)
  - `pnpm test:e2e:ci` ✅ (`33 passed`)
  - `FRAMEWORK_DOCTOR_STRICT=1 pnpm framework:doctor` ✅ (`ok:9 warn:0 limit:0 fail:0`)
  - `pnpm security:audit` ❌ (falhou por leaks historicos detectados por gitleaks no git history, fora do escopo desta correcao).

### Correcao definitiva de host/callback no CI (2026-02-11)

- Causa raiz identificada por log remoto:
  - E2E em CI rodava app em `127.0.0.1:<porta>`.
  - `NEXT_PUBLIC_APP_URL` chegava como `http://localhost:3000` via workflow.
  - mismatch de origem quebrava sessao/callback do Better Auth, causando timeouts em planner/protected/screens.
- Correcao aplicada:
  - `scripts/test-e2e.mjs` agora força origem canonica de auth para o `baseURL` real do run:
    - `NEXT_PUBLIC_APP_URL = baseURL`
    - `BETTER_AUTH_BASE_URL = baseURL`
    - `BETTER_AUTH_URL = baseURL`
- Evidencia:
  - reproducao local com conflito proposital de host (`NEXT_PUBLIC_APP_URL=http://localhost:3000 BETTER_AUTH_URL=http://localhost:3000`) + `pnpm test:e2e:ci` ✅ (`33 passed`).
  - `pnpm lint` ✅
  - `pnpm type-check` ✅

### Fechamento 10/10 operacional (2026-02-11)

- Governanca upstream reforcada em CI:
  - `.github/workflows/upstream-drift.yml` agora roda `framework:doctor` strict antes do `framework:check`.
  - `.github/workflows/upstream-sync-pr.yml` agora roda `framework:doctor` strict + `pnpm verify` (gate completo) antes de abrir/atualizar PR.
  - PR semanal de sync recebe owner explicito (`assignees: mneves75`).
- Checklist versionada adicionada:
  - `docs/framework-sync-checklist.pt-br.md` (pre-sync, fronteiras de conflito, pos-sync, governanca).
- Auditoria de segredos local ficou acionavel e deterministica:
  - `scripts/security-audit.sh` agora usa `SECURITY_AUDIT_GITLEAKS_SCOPE=head` por padrao e suporta `all` para varredura historica completa.
- Evidencias desta rodada:
  - `pnpm lint` ✅
  - `pnpm type-check` ✅
  - `pnpm security:audit` ✅
  - `FRAMEWORK_DOCTOR_STRICT=1 pnpm framework:doctor` ✅
  - `pnpm framework:check` ✅
  - `pnpm verify` ✅
