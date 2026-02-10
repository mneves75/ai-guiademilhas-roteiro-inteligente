# SEO: Solucao Elegante (10/10) Para Este Repo (Bootstrapped)

Atualizado: 2026-02-10

Este documento e deliberadamente "hostil a wishful thinking": define invariantes, criterios pass/fail e o que falta para 10/10 com evidencia.

## 0) Definicao de Done (pass/fail)

So e 10/10 quando:

- (Indexacao) Search Console configurado e `sitemap.xml` submetido; coverage sem URLs privadas indexadas.
- (Tecnico) Sitemap limpo, canonical consistente, `noindex` aplicado a superficies sensiveis, RSS publicado e descobrivel.
- (Crescimento) 1 pilar + 6-12 satelites com prova executavel; distribuicao repetivel; 1 KPI organico instrumentado.

## 1) Primeiros principios (Carmack review)

SEO e um sistema com invariantes. Se qualquer um falhar, o resto vira ruido.

1. Valor: a pagina precisa ser a melhor resposta para uma intencao real.
2. Descoberta: bots e humanos precisam encontrar (links internos, RSS, sitemap, links externos).
3. Indexacao correta: entra no indice so o que deve ranquear; o resto fica fora por default.
4. Loop: medir -> priorizar -> publicar -> repetir.

## 1.1) O que este repo e (features que viram SEO)

Este app nao e um "conteudo site". E um produto dev-tooling (boilerplate). Entao SEO precisa mapear features para intencoes tecnicas.

Features observaveis no repo (resumo):

- Auth completo (Better Auth): email/senha, OAuth, magic link, reset.
- Billing (Stripe): subscriptions + portal + webhooks.
- Multi-tenancy: workspaces, membros, convites, roles.
- Admin: usuarios, workspaces, subscriptions.
- Blog MDX + tags + OG + JSON-LD.
- Qualidade operacional: lint/type-check/unit/e2e/build e docs de seguranca/ops.

Traduza isso para paginas que o ICP busca:

- "nextjs saas boilerplate" / "nextjs starter kit"
- "nextjs multi tenant" / "workspaces rbac nextjs"
- "stripe subscriptions nextjs webhook idempotency"
- "better auth nextjs" / "magic link nextjs"

## 1.2) Mercado e competidores (o que voce enfrenta)

O mercado se divide em 3 classes:

1. Kits pagos com marketing forte: vendem "ship fast" com LP agressiva.
2. Starters open-source: volume alto, qualidade varia, ganha por comunidade.
3. Referencias/exemplos: confiaveis, mas incompletos como produto final.

Exemplos por classe (nao-exaustivo):

- Kits pagos: Makerkit, ShipFast.
- Open-source: Open SaaS e outros "nextjs saas starter" repos.
- Referencias: exemplos oficiais/educacionais e repos "payments/auth" focados em 1 feature.

Sem ads, voce nao vence por "promessa". Vence por:

- prova tecnica (codigo, diffs, testes, benchmarks)
- comparativos honestos (tradeoffs, limites, migracoes)
- conteudo que vira referencia citavel (links naturais)

## 1.3) Estrategia SEO sem budget (baseline + 1 foco)

Baseline (primeiras coisas que voce PRECISA fazer):

- Search Console + sitemap submission + rotina semanal.
- Garantir que nada privado indexa (noindex + X-Robots-Tag; sitemap limpo).
- Canonical e metadados consistentes nas paginas publicas chave.
- RSS publicado e descobrivel.

Maior leverage (90% do tempo):

- motor de conteudo tecnico comparativo com prova executavel
  - 60% escrever (1 artigo padrao-ouro/semana)
  - 20% distribuicao (1-2 canais por artigo)
  - 10% atualizar artigos com dados reais

Os outros 10%: tecnico/medicao (Search Console, CWV, correcoes de indexacao).

## 1.4) Cluster inicial (implementado no blog)

Pilar:

- URLs publicas sao estaveis por locale: `/pt-br/*` e `/en/*`.
- Pilar (pt-BR): `/pt-br/blog/nextjs-saas-boilerplate-10-10`

Satelites:

- pt-BR:
- `/pt-br/blog/multi-tenancy-workspaces-rbac-nextjs`
- `/pt-br/blog/stripe-subscriptions-webhooks-idempotentes-nextjs`
- `/pt-br/blog/better-auth-nextjs-app-router-sem-csr-bailout`
- `/pt-br/blog/seo-tecnico-nextjs-sitemap-robots-canonical-rss`
- `/pt-br/blog/playwright-e2e-deterministico-nextjs-standalone`
- `/pt-br/blog/headers-de-seguranca-nextjs-noindex-x-robots-tag`
- en:
- `/en/blog/getting-started`
- `/en/blog/why-nextjs-16`

## 2) O que precisa para 10/10 (criterios objetivos)

### 2.1 Tecnico (repo)

- Sitemap:
  - inclui apenas paginas publicas rankaveis (sem auth/privado/sensivel)
  - nao depende de `priority/changefreq` (o Google ignora)
- Canonical:
  - 1 canonical por pagina publica relevante (evita duplicacao e canibalizacao por URL drift)
- Noindex (defesa em profundidade):
  - `metadata.robots` em layouts privados/sensiveis
  - `X-Robots-Tag: noindex, nofollow` nas mesmas rotas (header e mais "duro" que meta)
  - robots.txt tratado como hint de crawl, nao como garantia de noindex
- RSS:
  - `/rss.xml` existe, e e descobrivel via autodiscovery
- Performance:
  - CWV aceitavel em landing, blog e pricing (o resto nao importa se ninguem chega la)

### 2.2 Conteudo (crescimento real)

- Pilar:
  - 1 pagina que seria aprovada por um reviewer tecnico hostil
  - define escopo, tradeoffs, e prova (codigo/config/testes) do que este boilerplate resolve melhor que alternativas
- Satelites (6-12):
  - cada artigo resolve 1 problema real, com prova executavel
  - links internos: satelite -> pilar e satelite -> 2-3 satelites relevantes

Checklist minimo de "prova" por artigo:

- snippet/arquivo que roda
- um tradeoff real
- uma falha comum e como detectar (logs, headers, testes, edge cases)
- "last updated" verdadeiro (versoes e compat)

### 2.3 Distribuicao (bootstrapped)

- Cada artigo precisa gerar pelo menos 1 asset citavel:
  - comparativo honesto (X vs Y)
  - checklist
  - benchmark reproduzivel
  - template reutilizavel
- Sem spam: distribuicao deve ser util por si so, sem pedir upvote.

### 2.4 Medicao (sem isso nao existe 10/10)

- Search Console:
  - sitemap submetido
  - queries e paginas revisadas semanalmente
- KPI organico (escolha 1):
  - stars/clones
  - signup
  - click para docs/quickstart
- Loop semanal:
  - impressao alta + clique baixo -> ajustar title/description e snippet
  - queda -> atualizar conteudo (versoes, gotchas, tradeoffs)

## 3) Implementacao elegante (invariantes em codigo)

O objetivo e reduzir regressao por arquitetura: um unico lugar decide a origem publica, e todo SEO deriva disso.

Implementado:

- Origem canonica centralizada:
  - `src/lib/seo/base-url.ts` (`resolvePublicOrigin()`)
- Rotas de SEO usam a origem canonica:
  - `app/sitemap.ts`, `app/robots.ts`, `app/rss.xml/route.ts`, `app/layout.tsx`
- `robots.txt` minimalista (anti-padrao evitado):
  - `app/robots.ts` bloqueia apenas `/api/`
  - superficies sensiveis usam `noindex` via meta + `X-Robots-Tag` (permitindo crawling para ver o `noindex`)
- Noindex por default em superficies sensiveis:
  - `app/(protected)/dashboard/layout.tsx`, `app/(protected)/admin/layout.tsx`, `app/invite/layout.tsx`, `app/emails/preview/page.tsx`
  - `next.config.ts` aplica `X-Robots-Tag` em `/dashboard/*`, `/admin/*`, `/invite/*`, `/emails/preview`
- Teste de regressao:
  - `src/lib/__tests__/seo-routes.vitest.ts`

## 4) Critica do estado atual

O que esta bom:

- Baseline tecnico esta enforced (sitemap limpo + canonical + noindex + RSS) e protegido por teste.

O que impede 10/10 hoje:

- Sem dados reais (Search Console + tempo), a estrategia nao fecha loop.
- Conteudo em volume/cluster ainda e insuficiente (2 posts nao constroem autoridade).

## 5) Alocacao de tempo (unica resposta honesta)

Sem ads, o maior leverage e conteudo + distribuicao + loop:

- 90%: motor de conteudo tecnico comparativo com prova executavel
  - 60% escrever (1 artigo padrao-ouro/semana)
  - 20% distribuicao (1-2 canais por artigo)
  - 10% atualizar artigos com dados reais
- 10%: tecnico/medicao (Search Console, CWV, correcoes de indexacao)

## 6) Falhas previsiveis (e como evitar)

- Thin content (tags/categorias):
  - so indexar tags quando houver massa critica + texto unico por tag
- Cannibalizacao:
  - 1 pagina por intencao; o resto vira satelite, nao concorrente
- Vazamento de indexacao:
  - confiar em `noindex` (meta + header) + auditoria via Search Console, nao em disallow
- i18n por cookie (mesma URL muda por locale):
  - se o conteudo diferir por idioma, o ideal e URL por idioma (ex.: /pt-br/...)

## 7) Referencias (fontes primarias)

- Google: robots.txt (limites do disallow; URL pode aparecer mesmo bloqueada). https://developers.google.com/search/docs/crawling-indexing/robots/intro
- Google: noindex (via meta tag ou response header). https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Google: sitemap (Google ignora priority/changefreq; lastmod precisa ser confiavel). https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Next.js: Metadata API (App Router). https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- RSS: autodiscovery. https://www.rssboard.org/rss-autodiscovery
