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
