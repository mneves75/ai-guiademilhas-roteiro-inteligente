# Plano v3 Revisado — Autocritica Pos-Pesquisa

## Autocritica do Plano v3 Original

| Decisao Original | Problema Identificado | Correcao |
|---|---|---|
| **Fase 8: Pipeline generate→critique** | AI SDK v6 ja valida schema via Zod. Second LLM pass custa 3-7x mais sem ROI medido. Apps de producao (ChatGPT, Cursor, Perplexity) NAO fazem critique em toda resposta. | **REMOVIDA**. Validacao Zod e suficiente. Adicionar critique somente se taxa de regeneracao >5% (medir primeiro). |
| **Cache em tabela DB (plan_cache)** | SHA256+DB nao e padrao da industria. Vercel AI SDK tem middleware de cache nativo. KV store: <5ms vs DB: 10-50ms. | **SIMPLIFICADO**. Usar `crypto.subtle.digest` + tabela Drizzle (sem Redis/KV extra — nao queremos mais um provider). Manter simplicidade. |
| **Schema auth: trocar driver e pronto** | Supabase usa `auth.users` (schema separado). FK via `pgSchema('auth')` + trigger de sync automatico e obrigatorio. Sem isso, orphaned rows. | **CORRIGIDO**. Adicionar trigger + referencia auth schema no Drizzle. |
| **Wizard: hooks customizados** | React Hook Form + Zod e padrao da industria para wizard forms. `.pick()` para validacao por step. | **MANTIDO como custom hook** (evitar dependencia RHF — o form atual ja funciona com useState). Trade-off: menos boilerplate vs menos dependencia. |
| **Wizard depende de Fase 1 (Supabase)** | O wizard e 100% UI — nao toca auth. Pode ser feito em paralelo com Fase 1. | **DESACOPLADO**. Wizard pode comecar antes de Fase 1 terminar. |
| **Historico (Fase 6) depende de Cache (Fase 5)** | Nao ha dependencia tecnica. Historico usa tabela plans (ja existe). Cache e otimizacao separada. | **DESACOPLADO**. Historico pode comecar apos Fase 1. |

## Plano Revisado: 7 Fases (era 8)

### Grafo de Dependencias Revisado

```
                ┌─→ Fase 2: Wizard ─────────────┐
Fase 1: Supabase┤                                ├─→ Fase 3: Schema Rico ──┬─→ Fase 4: PDF
                ├─→ Fase 5: Cache (independente) │                         └─→ Fase 7: Destino
                └─→ Fase 6: Historico             │
                                                  │
                    (Fase 2 pode comecar em       │
                     paralelo com Fase 1)         │
```

**Fase 8 (Validacao) REMOVIDA** — Zod validation do AI SDK e suficiente. Re-avaliar se taxa de regeneracao >5%.

### Mudancas por Fase

#### Fase 1: Supabase (ATUALIZADA)
- Adicionar `pgSchema('auth')` + `authUsers` reference no Drizzle schema
- Criar trigger SQL `handle_new_user()` para sync auth.users → public.users
- FK cascade de public.users.id → auth.users.id
- Manter tabela users existente (soft deletes, custom fields)
- `prepare: false` obrigatorio para connection pooler

#### Fase 2: Wizard (DESACOPLADA de Fase 1)
- Usar custom hook `useWizardForm` com useState + Zod `.pick()`
- localStorage via JSON.stringify direto (sem Zustand — simplicidade)
- 4 steps como planejado
- **Pode comecar em paralelo com Fase 1** (nao toca auth)

#### Fase 3: Schema Rico (SEM MUDANCA)
- `z.union([z.string(), structuredItemSchema])` confirmado como padrao
- Lazy migration: normalizar no read, escrever formato novo no save

#### Fase 4: PDF (CONFIRMADO)
- @react-pdf/renderer e a escolha certa (cold start <1s, React 19 compativel)
- Font.register() obrigatorio para pt-BR (Noto Sans)
- serverExternalPackages: ['@react-pdf/renderer'] no next.config

#### Fase 5: Cache (SIMPLIFICADO)
- Manter tabela Drizzle (evitar Redis/KV — menos providers)
- `crypto.subtle.digest('SHA-256', ...)` para hash determinístico
- TTL 7 dias
- Verificar cache ANTES do stream, retornar como SSE complete event

#### Fase 6: Historico (DESACOPLADO de Cache)
- Pode comecar apos Fase 1 (precisa de auth, mas nao de cache)
- Tabela plans ja existe com parentId

#### Fase 7: Destino (SEM MUDANCA)
- Prompt engineering no mesmo Gemini call
- Sem API externa

#### ~~Fase 8: Validacao~~ → **REMOVIDA**
- AI SDK v6 structured output + Zod ja valida
- Critique pipeline: 3-7x custo, beneficio nao medido
- Re-avaliar se taxa de regeneracao >5%

### Ordem de Execucao Otimizada

```
Wave 1 (paralelo): Fase 1 (Supabase) + Fase 2 (Wizard)
Wave 2 (paralelo): Fase 3 (Schema) + Fase 5 (Cache) + Fase 6 (Historico)
Wave 3 (paralelo): Fase 4 (PDF) + Fase 7 (Destino)
```

**Estimativa revisada**: ~1850 linhas (era 2150), 7 fases (era 8).

## Decisoes Carmack

1. **Sem adapter pattern para auth** — Auth e fundacional, nao swappable. Full rewrite, sem abstracoes.
2. **Sem Zustand para wizard** — useState + localStorage direto. Menos dependencias.
3. **Sem Redis/KV para cache** — Tabela Drizzle. Menos providers.
4. **Sem critique pipeline** — Zod validation e suficiente. Medir antes de complicar.
5. **Custom hook vs RHF para wizard** — O form atual ja funciona com useState. Adicionar RHF = dependencia nova para resolver problema ja resolvido.

## Fontes da Pesquisa
- Supabase Auth SSR: supabase.com/docs/guides/auth/server-side/nextjs
- Drizzle + Supabase: orm.drizzle.team/docs/tutorials/drizzle-with-supabase
- Schema Evolution: confluent.io/platform/current/schema-registry
- LLM Caching: aws.amazon.com/blogs/database/optimize-llm-response-costs
- React-PDF: react-pdf.org/compatibility
- AI SDK Validation: ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
