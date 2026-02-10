# SEO: Solucao Elegante (Bootstrapped) para Este Repo

Atualizado: 2026-02-10

## 0) Escopo (o que estamos otimizando)

- Produto: boilerplate/starter kit open-source de Next.js 16 para SaaS (auth, Stripe, multi-tenancy, admin, blog).
- Publico-alvo (ICP): devs/founders/agencias que querem shippar SaaS rapido, com defaults de producao.
- Restricao: sem ads. O unico combustivel e tempo + distribuicao + reputacao.

Se o ICP nao for esse, tudo abaixo muda (keywords, paginas, prova, distribuicao).

## 1) Primeiros principios (Carmack review)

SEO e um sistema com 4 invariantes. Se qualquer um falhar, “otimizacao” vira ruido.

1. **Valor**: voce precisa ser a melhor resposta para uma intencao real (nao “conteudo para rankear”).
2. **Descoberta**: bots e humanos precisam achar o conteudo (links internos + externos + RSS + sitemap).
3. **Indexacao correta**: paginas certas entram no indice; paginas erradas ficam fora.
4. **Loop de melhoria**: medir (Search Console) -> ajustar backlog -> publicar -> repetir.

O “elegante” aqui e reduzir trabalho manual por meio de invariantes verificaveis no repo.

## 2) O que precisa para 10/10 (criterios verificaveis)

**10/10 = (tecnico) + (conteudo) + (distribuicao) + (medicao)**, tudo fechado por evidencias.

Tecnico (pass/fail):

- Sitemap contem apenas paginas publicas que voce quer ranquear (sem auth/privado).
- Canonical consistente em paginas publicas.
- `noindex` aplicado a areas privadas/sensiveis (dashboard/admin/invite, preview).
- OG/Twitter metadata por pagina para melhorar CTR/shares.
- RSS publicado e descobrivel.
- CWV aceitavel (LCP/INP/CLS) em landing + blog + pricing.

Conteudo (pass/fail):

- 1 pagina pilar excelente (a melhor da internet para 1 termo-alvo).
- 6-12 artigos satelites que:
  - resolvem problemas concretos,
  - tem prova (codigo, configuracoes, diffs, testes, tradeoffs),
  - linkam entre si (cluster).

Distribuicao (pass/fail):

- Cada artigo tem pelo menos 1 canal de distribuicao “first-class” (HN/Reddit/communities/newsletters) sem spam.
- Existe um mecanismo repetivel de conquistar links (comparativos, benchmarks, checklists, templates reutilizaveis).

Medicao (pass/fail):

- Search Console configurado e acompanhado semanalmente.
- 1 KPI de conversao org (ex.: stars/clones, signup, “copy to repo”) instrumentado (PostHog ja existe).

## 3) Critica do estado atual (primeiros principios)

O que esta bom:

- A base tecnica existe (App Router, metadata global, blog, robots/sitemap).
- Ja ha cultura de “verificabilidade” (lint/type-check/test/build, docs de critic/solucao elegante).

O que nao e 10/10 ainda:

- Sem dados reais de Search Console: nao existe feedback loop (hoje a estrategia e hipotese).
- Conteudo e raso em volume (2 posts): nao sustenta topical authority.
- Tags podem virar thin content se escalarem sem criterio (por isso nao devem ser tratadas como “pagina-alvo” por default).

## 4) Baseline: primeiras coisas criticas (NEED)

1. Configurar Search Console + sitemap submission.
2. Garantir indexacao correta: sitemap limpo + `noindex` em rotas privadas/sensiveis.
3. Canonical/OG/Twitter consistentes nas paginas publicas.
4. RSS do blog.
5. Um backlog de conteudo guiado por intencao (queries) e nao por “temas legais”.

## 5) O maior leverage (90% do seu tempo)

**Motor de conteudo tecnico comparativo com prova executavel.**

Alocacao:

- 60%: escrever (1 artigo “padrão-ouro” por semana).
- 20%: distribuicao (1 post/thread por canal por artigo; responder perguntas tecnicas onde o ICP esta).
- 10%: atualizar artigos antigos com dados reais (ex.: compat, versoes, gotchas, benchmarks).
- 10%: tecnico/medicao (Search Console, CWV, correcoes de indexacao).

Se voce so puder fazer 1 coisa: escrever o pilar + 4 satelites com comparativos e diffs reais.

## 6) Landscape/competidores (como vencer sem budget)

Competidores existem em 3 classes:

- Kits pagos com marketing forte e LP agressiva.
- Starters open-source (muito volume; qualidade varia).
- Exemplos “reference” (bons, mas incompletos como produto).

Sem ads, sua vantagem defensavel vem de:

- prova (tests, segurança, ops, multi-DB real),
- comparativos honestos,
- guias que viram referencia citavel.

## 7) “Implementar a solucao elegante” no repo (invariantes em codigo)

Esta solucao vira 10/10 quando o repo impede regressao por default:

- Um unico resolvedor de origem publica para URLs canonicas (evita bugs quando `NEXT_PUBLIC_APP_URL` tem path).
- Sitemap/robots/rss gerados a partir dessa origem.
- Testes unitarios garantindo que sitemap nao inclua auth e que rss/robots continuem validos.

## 8) O que posso fazer melhor (autocritica)

- Eu nao consigo provar resultados de SEO sem dados reais (Search Console + tempo).
- Melhoraria o plano com:
  - lista inicial de queries (seed) por intencao,
  - mapping pilar/satelites por cluster,
  - criterio objetivo de publicar tags (ex.: minimo de posts por tag).

## 9) Proximos passos (minimos)

1. Me diga qual e o ICP real (founders? agencias? devs juniors/seniors?) e 1 “dor” principal.
2. Eu devolvo: 1 pilar + 8 titulos satelites (com outline e CTAs) e a arquitetura de links internos.
