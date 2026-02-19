# Solução Elegante 10/10 (First Principles, pt-BR)

Data: 2026-02-11

## 1) Padrão de mercado usado como referência

Esta revisão segue práticas aceitas para produto web orientado a aquisição e conversão:

- SEO técnico no App Router (canonical, alternates, metadata).
- Dados estruturados válidos para intenção transacional/informativa (FAQPage).
- Funil mensurável de ponta a ponta (aquisição -> ativação -> resultado).
- Experimentação com guardrails e checks de qualidade de dados.
- Governança de segurança com baseline ASVS e gates de CI.

Fontes primárias:

- Next.js Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Next.js JSON-LD: https://nextjs.org/docs/app/guides/json-ld
- Google `hreflang`: https://developers.google.com/search/docs/specialty/international/localized-versions
- Schema.org FAQPage: https://schema.org/FAQPage
- PostHog best practices: https://posthog.com/docs/product-analytics/best-practices
- PostHog funnels: https://posthog.com/docs/product-analytics/funnels
- GrowthBook experiments/guardrails/SRM: https://docs.growthbook.io/using/experimenting
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/

## 2) Crítica por primeiros princípios

Pergunta raiz:
"Estamos removendo incerteza da decisão do usuário e maximizando conversão sem aumentar fragilidade operacional?"

Diagnóstico:

- Forte:
  - Base técnica sólida de locale/canonical/alternates.
  - Fluxo de auth com callback seguro para planner.
  - CI já rígido (lint/type/test/build/e2e).
- Fraco:
  - Antes não havia trilha mensurável completa do funil da landing.
  - Havia validação parcial de SEO semântico (faltava cobertura de progressão de funil).
  - Critérios de "10/10" estavam implícitos, não explicitados como checklist executável.

## 3) Versão forte implementada (atualizada)

### 3.1 SEO semântico robusto

- `FAQPage` JSON-LD derivado do conteúdo da landing.
- Teste E2E garantindo presença e estrutura mínima do schema.

### 3.2 Funil ponta a ponta instrumentado

- Origem de funil explícita em URLs (`source=landing_planner`) para CTAs da landing.
- Propagação da origem entre login e signup sem perder callback.
- Contrato da API do planner com `source` opcional para rastreio de origem no backend.
- Telemetria de etapas no cliente:
  - `planner_funnel_auth_viewed`
  - `planner_funnel_auth_completed`
  - `planner_funnel_opened`
  - `planner_funnel_generated`
- Telemetria da conversão final também no servidor (`planner_funnel_generated`, `channel=server`) para reduzir perda por bloqueadores/adblock.
- Persistência temporária de origem em `sessionStorage` para conectar auth -> planner.

### 3.3 Invariantes de qualidade de conteúdo e tracking

- Testes unitários para helpers de funil (normalização/propagação de source).
- Invariantes de copy/SEO mantidos por testes para `pt-BR` e `en`.

## 4) O que falta para 10/10 absoluto

Checklist objetivo:

1. [ ] Definir SLO formal de funil (ex.: `landing->auth_completed` e `auth_completed->planner_generated`) com limites numéricos.
2. [x] Alertas automáticos em produção para regressão de conversão por etapa.
3. [ ] Pipeline de experimentação com hipótese pré-registrada, tamanho de amostra e regra de parada.
4. [x] Validação sintática + semântica de JSON-LD em CI via schema checker dedicado.

## 5) Autocrítica direta

- Estou satisfeito com a evolução técnica desta rodada: ficou mais mensurável, menos opinativo e mais alinhado com padrão de mercado.
- O principal ponto a melhorar é operacional: transformar eventos em decisões automáticas (SLO + alerta + experimento), não só em dados coletados.

## 6) Atualização desta rodada (autônoma)

- `FAQPage` agora nasce por helper validado por schema (`zod`) e testado em CI.
- SLO de funil foi codificado em módulo de avaliação determinística (`landing->auth`, `auth->planner`) com testes.
- Métrica Prometheus de conversão final (`app_planner_funnel_generated_total`) e alertas operacionais de funil adicionados.
- Resultado: checklist técnico ficou mais “executável” e menos subjetivo.
