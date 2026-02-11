# Critica 10/10 (Primeiros Principios) e Padroes de Industria

Atualizado: 2026-02-11

Este documento existe para "Carmack review": justificar escolhas por invariantes, reduzir classes inteiras de falhas e manter verificabilidade operacional.

## 1) O problema (primeiros principios)

Se um fluxo critico (auth) falha em E2E por "timing", o problema nao e o teste: e arquitetura.

Invariantes desejadas:

- Parametros de URL (callbackUrl, token) devem ser normalizados no server e vir como props estaveis para o client.
- Locale nao pode depender de `useEffect`/DOM para existir no primeiro render, nem de estado local que possa divergir do server.
- Validacao nao pode depender do tooltip do HTML5 (varia por browser/idioma); deve ser deterministica e controlada.
- UI nunca deve vazar mensagens internas do backend (por ex. strings de validacao).
- "Fix" nao pode ser "aumentar timeout" ou "waitForTimeout": isso so mascara a classe de falha.

## 2) Padrao de industria aplicado (resumo)

- Next.js App Router:
  - Evitar CSR bailout por `useSearchParams()` no topo da pagina; preferir parse no Server Component e repassar props.
- OWASP:
  - Tratar enumeracao de contas: mensagens genericas em login/reset e considerar o mesmo principio em signup.
- CSP:
  - Em paginas com dados sensiveis, usar CSP estrita baseada em nonce + `strict-dynamic` (defesa em profundidade contra XSS).
- Deploy:
  - Para self-host/Docker, `output: 'standalone'` e o caminho para runtime deterministico (server.js + assets).
- security.txt:
  - Publicar `/.well-known/security.txt` (RFC 9116) para canal de divulgacao responsavel e automatizacao.
- SDLC:
  - Usar OWASP ASVS como "yarnstick" de controles verificaveis e NIST SSDF como guia de praticas de engenharia.

## 3) O que esta implementado no repo (highlights)

- Auth estavel: padrao Server wrapper + Client form em `(auth)/*`.
- Anti open-redirect: normalizacao de `callbackUrl` no server.
- Erros de auth mapeados para UI (sem vazamento) + testes unitarios.
- DAST-lite via Playwright com `@dast` (headers, no-store, CSP nonce, redirects).
- `/.well-known/security.txt` (RFC 9116) real + `/security` page + teste E2E.
- Isolamento de builds E2E (distDir separado) sem quebrar standalone runtime.
- i18n/locale: locale resolvido no server e propagado sem estado client-side:
  - Troca de idioma via Server Action (cookie `httpOnly`), seguida de `router.refresh()`.
  - `getRequestLocale()` memoizado por request (`react/cache`) para consistencia e evitar leituras repetidas.
- Landing propria do produto (sem dependencia da landing do framework), com CTA direto para planner.
- Planner server-side com contrato estruturado:
  - endpoint autenticado `POST /api/planner/generate`.
  - retorno deterministico e versionado `{ schemaVersion, generatedAt, report, mode }`.
  - fallback resiliente quando IA indisponivel, mantendo UX funcional e auditavel.
  - erro de rate limit padronizado com `application/problem+json` (RFC 9457) + `Retry-After`.

Comandos:

- E2E completo: `PW_FULL=1 pnpm test:e2e`
- Auditoria local: `pnpm security:audit`

## 4) O que falta para 10/10 operacional (depende de deploy real)

- DAST automatico em preview/prod precisa de `deployment_status.target_url` (ou `environment_url`) no GitHub Actions.
- Rate limit "hard" em producao: configurar store compartilhado (Upstash) quando multi-instancia/serverless.
- Observabilidade real: conectar Prometheus/Alertmanager/Grafana no ambiente (tokens, scrape, alert routes).
- Reuso de framework com rotina upstream formalizada (`origin` + `upstream`) e sync recorrente com gates.

## 5) Melhorias futuras (opcionais, mas "elite")

- CSP reporting (`report-to`) + coleta de violacoes.
- Assinar `security.txt` (OpenPGP) e monitorar integridade (recomendado pela RFC).
- Checklist ASVS versionado (IDs + evidencias) como criterio de release.

## 6) Evidencia de fechamento (estado atual)

- `PW_FULL=1 pnpm test:e2e`:
  - `161 passed`, `4 skipped` (skips intencionais de smoke amplo fora de chromium).
- `pnpm verify`:
  - `lint`, `type-check`, `test`, `build`, `db:smoke`, `test:e2e:ci` todos verdes.
- `pnpm security:audit`:
  - `pnpm audit --prod`: sem vulnerabilidades conhecidas.
  - DAST-lite `@dast`: `4 passed`.
  - Gates basicos (`lint`, `type-check`, `test`) verdes.
- Contrato do planner atualizado:
  - `docs/API.md` documenta resposta versionada e `problem+json`.
  - `src/lib/planner/api-contract.ts` centraliza parse resiliente (v2 + legado).
