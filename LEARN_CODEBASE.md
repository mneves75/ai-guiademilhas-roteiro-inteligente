# Guia de Milhas — Entendendo o Codebase

> **Para quem**: devs iniciantes no time.
> **Filosofia**: explicar o _porquê_ de cada decisão, não apenas o _quê_. Se você sabe _por que_ algo existe, consegue modificá-lo sem medo. Se só sabe _o que_ faz, vai ter medo de tocar.

---

## Índice

| #   | Seção                                                                                 | O Que Você Vai Aprender                                    |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0   | [O Problema Que Resolvemos](#0-o-problema-que-resolvemos)                             | Contexto de negócio — sem isso, o código não faz sentido   |
| 1   | [Visão C4 Nível 1 — Contexto](#1-visão-c4-nível-1--contexto)                          | O sistema e seus vizinhos                                  |
| 2   | [Visão C4 Nível 2 — Containers](#2-visão-c4-nível-2--containers)                      | Os grandes blocos dentro do sistema                        |
| 3   | [Visão C4 Nível 3 — Componentes](#3-visão-c4-nível-3--componentes)                    | Cada módulo e sua responsabilidade                         |
| 4   | [Invariantes do Sistema](#4-invariantes-do-sistema)                                   | Propriedades que NUNCA podem ser violadas                  |
| 5   | [Decisões Arquiteturais (ADRs)](#5-decisões-arquiteturais-adrs)                       | As escolhas difíceis e seus trade-offs                     |
| 6   | [O Pipeline de uma Requisição](#6-o-pipeline-de-uma-requisição)                       | Toda requisição HTTP, do navegador ao banco, passo a passo |
| 7   | [O Pipeline do Planner IA](#7-o-pipeline-do-planner-ia)                               | O core do produto: como a IA gera relatórios               |
| 8   | [Modelo de Dados](#8-modelo-de-dados)                                                 | Todas as tabelas, seus relacionamentos e a lógica por trás |
| 9   | [Camada de Segurança](#9-camada-de-segurança)                                         | Defesa em profundidade, do Edge ao banco                   |
| 10  | [Guia de Navegação — "Preciso Mexer em X"](#10-guia-de-navegação--preciso-mexer-em-x) | Índice orientado a tarefa                                  |
| 11  | [Modos de Falha e Debugging](#11-modos-de-falha-e-debugging)                          | O que quebra, por que quebra, e como investigar            |
| 12  | [Comandos Essenciais](#12-comandos-essenciais)                                        | Seu primeiro dia                                           |
| 13  | [Glossário Preciso](#13-glossário-preciso)                                            | Termos com definição exata                                 |

---

## 0. O Problema Que Resolvemos

Emitir passagens com milhas é um problema de otimização mal-definido: o viajante precisa cruzar datas flexíveis, múltiplos programas de fidelidade, regras de cada companhia, janelas de disponibilidade e restrições de orçamento. Fazer isso manualmente leva horas e exige expertise.

**Guia de Milhas** resolve isso em três passos:

1. O usuário preenche um formulário com suas preferências (datas, origens, destinos, programas de milhas, perfil de viajante)
2. O sistema monta um prompt estruturado e envia ao Google Gemini
3. O Gemini retorna um relatório validado por schema Zod: título, resumo executivo, 4-8 seções com itens acionáveis, e uma lista de premissas assumidas

O resultado é um plano de ação concreto — não uma conversa aberta com chatbot, mas um **artefato estruturado e reproduzível**.

**Por que isso importa para o código**: toda decisão arquitetural no projeto serve a esse fluxo. O multi-tenancy existe porque queremos white-label. O streaming existe porque TTFT < 500ms é uma métrica de produto. O fallback local existe porque o usuário jamais deve ver uma tela vazia.

---

## 1. Visão C4 Nível 1 — Contexto

> _"Quem usa o sistema e com quem ele conversa?"_

```mermaid
graph TB
    User["👤 Viajante<br/>(navegador web)"]
    Admin["🔧 Admin<br/>(painel de gestão)"]

    System["🧭 Guia de Milhas<br/>(Next.js 16)"]

    Gemini["Google Gemini API<br/>(geração de relatórios)"]
    Stripe["Stripe<br/>(pagamentos e assinaturas)"]
    Postgres["PostgreSQL / Supabase<br/>(dados, auth, filas)"]
    PostHog["PostHog<br/>(analytics comportamental)"]
    Sentry["Sentry<br/>(monitoramento de erros)"]
    Resend["Resend<br/>(transacional de email)"]

    User -->|"preenche preferências,<br/>recebe relatórios"| System
    Admin -->|"gerencia workspaces,<br/>monitora uso"| System

    System -->|"prompt → relatório<br/>estruturado (JSON)"| Gemini
    System -->|"checkout, webhooks,<br/>portal de cobrança"| Stripe
    System -->|"leitura/escrita<br/>de dados"| Postgres
    System -->|"eventos de<br/>comportamento"| PostHog
    System -->|"erros 5xx"| Sentry
    System -->|"welcome, magic link,<br/>reset de senha"| Resend
```

**Ponto-chave**: PostgreSQL é a **única** infraestrutura de estado. Não existe Redis, RabbitMQ, S3 para dados críticos. Essa é uma decisão deliberada — veja [ADR-02](#adr-02-postgresql-como-infraestrutura-única).

---

## 2. Visão C4 Nível 2 — Containers

> _"Quais são os processos que compõem o sistema?"_

Na prática, tudo roda dentro de **um único deploy Next.js**. Mas logicamente, existem quatro containers distintos:

```mermaid
graph TD
    subgraph Deploy["Deploy Next.js (Vercel / Docker)"]
        Proxy["proxy.ts<br/>──────────────<br/>Edge Runtime<br/>(segurança, rate limit,<br/>locale, CSP, CSRF)"]

        SSR["Server Components<br/>──────────────<br/>Node.js Runtime<br/>(páginas, layouts)"]

        API["API Routes<br/>──────────────<br/>Node.js Runtime<br/>(endpoints REST)"]

        Client["Client Components<br/>──────────────<br/>Navegador<br/>(interatividade)"]
    end

    Proxy -->|"toda requisição<br/>passa primeiro aqui"| SSR
    Proxy -->|"toda requisição<br/>passa primeiro aqui"| API
    SSR -->|"hidrata"| Client

    API --> DB["PostgreSQL"]
    API --> Gemini["Gemini API"]
    API --> StripeAPI["Stripe API"]
```

**O que diferencia este projeto de um Next.js vanilla**: nós NÃO usamos `middleware.ts`. Em vez disso, usamos `proxy.ts` — que é efetivamente o middleware renomeado para forçar o time a tratá-lo como um pipeline de segurança explícito, não como um "middleware qualquer". Cada função no proxy é uma etapa nomeada e auditável.

---

## 3. Visão C4 Nível 3 — Componentes

> _"Quais módulos existem e o que cada um faz?"_

```mermaid
graph LR
    subgraph "app/ — Roteamento"
        AuthPages["(auth)/<br/>login, signup,<br/>forgot, reset"]
        ProtPages["(protected)/<br/>dashboard, planner, admin"]
        APIRoutes["api/<br/>auth, planner, stripe,<br/>workspaces, health"]
    end

    subgraph "src/lib/ — Lógica de Negócio"
        Auth["auth.ts<br/>Better Auth config"]
        Planner["planner/<br/>prompt, generate,<br/>stream, schema"]
        StripeMod["stripe.ts +<br/>stripe-helpers.ts"]
        Security["security/<br/>rate-limit, origin,<br/>redirect, CSP"]
        Logging["logging.ts<br/>withApiLogging"]
        Analytics["analytics/<br/>PostHog, funnel"]
    end

    subgraph "src/db/ — Dados"
        ClientDB["client.ts<br/>singleton lazy"]
        Schema["schema/<br/>postgres.ts, sqlite.ts,<br/>types.ts"]
        Queries["queries/<br/>workspaces, plans,<br/>subscriptions, users"]
    end

    subgraph "src/components/ — UI"
        UILib["ui/<br/>Button, Card, Dialog..."]
        Landing["landing/<br/>seções da homepage"]
        PlannerComp["planner/<br/>formulário, resultado"]
    end

    APIRoutes --> Auth
    APIRoutes --> Planner
    APIRoutes --> StripeMod
    APIRoutes --> Logging
    Planner --> ClientDB
    StripeMod --> ClientDB
    Auth --> ClientDB
    ClientDB --> Schema
    ClientDB --> Queries
```

### Responsabilidade Exata de Cada Módulo

| Módulo        | Arquivo(s) Principal(is)                  | Responsabilidade Única                                                        |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| **Auth**      | `src/lib/auth.ts`                         | Configura Better Auth: email/senha, magic link, social, admin, hooks de banco |
| **Planner**   | `src/lib/planner/` (6 arquivos)           | Validar entrada → construir prompt → chamar Gemini → validar saída → fallback |
| **Stripe**    | `src/lib/stripe.ts` + `stripe-helpers.ts` | Criar clientes, sessões de checkout/portal, processar webhooks, mapear planos |
| **Security**  | `src/lib/security/` (7 arquivos)          | Rate limiting (Upstash/memória), validação de origin, CSP, safe redirects     |
| **Logging**   | `src/lib/logging.ts`                      | HoF que envolve handlers com request-id, timing, log JSON, captura Sentry     |
| **DB Client** | `src/db/client.ts`                        | Singleton lazy com Proxy — resolve Postgres/SQLite/D1 em runtime              |
| **Schema**    | `src/db/schema/`                          | Definição de tabelas dual-dialect, tipos agnósticos, schemas Zod de validação |
| **Queries**   | `src/db/queries/`                         | Operações específicas (CRUD workspace, planos, convites, assinaturas)         |
| **Proxy**     | `proxy.ts` (raiz)                         | Pipeline Edge: request-id → locale → rate limit → CSRF → CSP → auth redirect  |

---

## 4. Invariantes do Sistema

> _Invariante = propriedade que deve ser verdadeira em todos os estados possíveis do sistema. Se for violada, temos um bug de segurança ou corrupção de dados._

### INV-01: Sem Hard Delete

```
∀ tabelas T com coluna deletedAt:
  NUNCA executar DELETE FROM T.
  Sempre: UPDATE T SET deletedAt = now() WHERE ...
```

**Por quê**: recuperabilidade, auditoria, e conformidade. Em um produto com dados financeiros (assinaturas Stripe) e dados gerados por IA (relatórios), destruir registros é irreversível e inaceitável.

**Como verificar**: se você vê `db.delete(` em qualquer lugar do código (exceto em seeds/testes), é um bug.

**Como filtrar**: toda query deve incluir `isNull(tabela.deletedAt)`.

---

### INV-02: Isolamento de Workspace

```
∀ queries Q que leem ou escrevem dados de workspace:
  Q DEVE conter filtro WHERE workspaceId = <id do workspace atual>
```

**Por quê**: workspaces são tenants isolados. Um usuário do Workspace A nunca deve ver, modificar ou inferir a existência de dados do Workspace B. Violar isso é um vazamento de dados entre clientes.

**Exceção**: rotas de admin global (acessíveis apenas por `role = 'admin'`).

---

### INV-03: Parâmetros de Rota São Promises

```
∀ componentes de página P com params:
  typeof params === 'Promise' → DEVE usar await
```

**Por quê**: Next.js 16 mudou a API de route params para Promise. Acessar `params.id` diretamente compila mas quebra em runtime. Este é o erro mais comum de devs vindos do Next.js 14/15.

---

### INV-04: Módulos Server-Only Nunca Vazam

```
∀ módulos M que acessam DB, secrets, ou APIs server-side:
  M DEVE ter import 'server-only' na primeira linha
```

**Por quê**: se um Client Component importar acidentalmente `auth.ts` ou `client.ts`, o build vai tentar bundlar secrets, drivers de banco, e código Node.js para o navegador. O import `'server-only'` transforma isso em um erro de build imediato em vez de um bug sutil em produção.

---

### INV-05: Todo Endpoint API é Logado

```
∀ export async function POST/GET/PUT/DELETE em app/api/:
  handler DEVE ser envolvido por withApiLogging(prefixo, handler)
```

**Por quê**: sem isso, erros 500 são silenciosos — não aparecem no Sentry, não têm request-id, não registram duração. Debugging se torna impossível.

---

## 5. Decisões Arquiteturais (ADRs)

> _Cada ADR explica: o contexto, a decisão, as alternativas rejeitadas, e as consequências._

### ADR-01: Better Auth em vez de NextAuth/Supabase Auth

|                             |                                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contexto**                | Precisávamos de autenticação com email/senha, magic links, OAuth, e roles de admin. A migração do NextAuth já havia acontecido.                                         |
| **Decisão**                 | Better Auth com adapter Drizzle, plugins `admin` e `magicLink`.                                                                                                         |
| **Alternativas rejeitadas** | **NextAuth**: API instável entre versões, difícil de customizar hooks de banco. **Supabase Auth**: acoplaria auth ao Supabase, impossibilitando rodar local com SQLite. |
| **Trade-off aceito**        | Better Auth é menos popular (menos Stack Overflow), mas o código-fonte é legível e testável.                                                                            |
| **Consequência**            | Auth funciona identicamente em Postgres e SQLite, permitindo dev local sem Supabase.                                                                                    |

---

### ADR-02: PostgreSQL Como Infraestrutura Única

|                      |                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Contexto**         | O PRD original mencionava "filas" e "cache". A tentação é adicionar Redis e RabbitMQ.                                                                                                                                                |
| **Decisão**          | PostgreSQL para _tudo_: dados relacionais, sessões, e futuramente filas (`SKIP LOCKED`). Zero Redis.                                                                                                                                 |
| **Por quê**          | Cada componente de infraestrutura é um modo de falha. Redis caindo = auth degradada. RabbitMQ = mais um serviço para monitorar, escalar, versionar. Um único Postgres bem dimensionado cobre nossas necessidades até 10k concurrent. |
| **Quando reavaliar** | Quando load testing provar que Postgres não aguenta a carga. Não antes.                                                                                                                                                              |

---

### ADR-03: proxy.ts em vez de middleware.ts

|                  |                                                                                                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contexto**     | Next.js usa `middleware.ts` para interceptação de requisições. O nome genérico incentiva colocar _tudo_ lá: auth, redirect, A/B testing, logging.                                                                                   |
| **Decisão**      | Renomear para `proxy.ts`. Tratar como pipeline de segurança com funções nomeadas, cada uma fazendo exatamente uma coisa: `withRequestId()`, `getPreferredLocale()`, `buildProtectedCsp()`, `checkRateLimit()`, `isAllowedOrigin()`. |
| **Por quê**      | Auditabilidade. Cada etapa é grep-ável. Quando o time de segurança pergunta "como funciona o CSRF?", a resposta é `proxy.ts:getRequestOriginForCsrf()`.                                                                             |
| **Consequência** | Não podemos usar o nome `middleware.ts` (AGENTS.md proíbe explicitamente).                                                                                                                                                          |

---

### ADR-04: Drizzle ORM Multi-Dialect com Proxy Lazy

|                      |                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contexto**         | Precisamos suportar: Postgres (produção), SQLite (dev local), D1 (edge futuro).                                                                                                                                                 |
| **Decisão**          | Schema duplicado (`postgres.ts` + `sqlite.ts`) com tipos compartilhados (`types.ts`). Client usa Proxy para inicialização lazy.                                                                                                 |
| **Por quê**          | A alternativa seria um ORM que abstrai dialetos (Prisma). Mas Prisma gera um cliente que não funciona em Edge e a migração é opaca. Drizzle gera SQL legível, e o schema duplicado nos força a manter portabilidade consciente. |
| **Trade-off aceito** | Mudanças de schema exigem editar dois arquivos. `pnpm db:schema-parity` verifica se estão sincronizados.                                                                                                                        |
| **Lazy Proxy**       | O `client.ts` usa `new Proxy()` para que `import { db }` NUNCA dispare uma conexão. A conexão só é aberta quando `db.query.*` é chamado. Isso permite que `next build` importa o módulo sem crash mesmo sem `DATABASE_URL`.     |

---

### ADR-05: Fallback Local para o Planner

|                  |                                                                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contexto**     | O Gemini pode falhar (API key ausente em dev, timeout, resposta fora do schema).                                                                                                        |
| **Decisão**      | Se Gemini falha, `buildFallbackReport()` gera um relatório local baseado nos próprios dados do usuário + templates estáticos. O campo `mode` na resposta indica `'ai'` ou `'fallback'`. |
| **Por quê**      | O usuário nunca deve ver uma tela vazia. Mesmo um relatório template tem mais valor que um erro 500.                                                                                    |
| **Consequência** | O frontend DEVE checar `mode` e pode exibir um aviso quando `mode === 'fallback'`.                                                                                                      |

---

### ADR-06: Rate Limiting com Fallback Gracioso

|              |                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contexto** | Precisamos de rate limiting no Edge (proxy.ts), mas não queremos dependência hard de Redis.                                                                                                     |
| **Decisão**  | Se Upstash Redis está configurado, usa fixed-window distribuído. Se não, fallback para `Map` in-memory por instância Edge. Se Upstash está configurado mas falha (rede), fallback para memória. |
| **Por quê**  | Rate limiting deve ser uma **proteção, não um ponto de falha**. Se o rate limiter cair, preferimos servir tráfego sem limite a rejeitar 100% das requisições.                                   |

---

## 6. O Pipeline de uma Requisição

> _Toda_ requisição HTTP (página ou API) passa por esta sequência exata:

```mermaid
sequenceDiagram
    participant B as Navegador
    participant P as proxy.ts (Edge)
    participant R as Route Handler (Node)
    participant L as withApiLogging
    participant H as Handler real
    participant DB as PostgreSQL

    B->>P: GET /dashboard
    Note over P: 1. getOrCreateRequestId()
    Note over P: 2. getPreferredLocale()
    Note over P: 3. checkRateLimit()
    alt Rate limit excedido
        P-->>B: 429 Too Many Requests
    end
    Note over P: 4. CSRF check (POST/PUT/PATCH/DELETE)
    alt Origin inválida
        P-->>B: 403 Forbidden
    end
    Note over P: 5. generateCspNonce() + buildProtectedCsp()
    Note over P: 6. hasBetterAuthSessionCookie()?
    alt Sem sessão em rota protegida
        P-->>B: 302 Redirect → /login
    end
    Note over P: 7. Set headers: x-request-id,<br/>x-csp-nonce, security headers

    P->>R: Requisição autorizada

    R->>L: withApiLogging("api.recurso", handler)
    Note over L: Log: request_received {requestId, method, path}
    L->>H: Executa handler
    H->>DB: Query/Mutação
    DB-->>H: Resultado
    H-->>L: Response
    Note over L: Log: request_completed {status, durationMs}
    alt status >= 500
        L->>L: captureException(err) → Sentry
    end
    L-->>B: JSON Response + x-request-id header
```

**Implicações práticas**:

- Todo response tem header `x-request-id`. Use esse ID para correlacionar logs.
- Rate limiting acontece ANTES da autenticação — um atacante fazendo brute-force é bloqueado sem tocar o banco.
- CSP nonce é gerado por requisição — scripts inline sem nonce são bloqueados pelo navegador.

---

## 7. O Pipeline do Planner IA

Este é o fluxo mais importante do sistema — é o produto.

```mermaid
flowchart TD
    Input["Formulário do usuário<br/>(TravelPreferencesInput)"]

    Validate["plannerGenerateRequestSchema.parse()<br/>──────────<br/>Valida com Zod: datas ISO,<br/>contagens, enums, limites de chars.<br/>data_volta >= data_ida"]

    SysPrompt["buildSystemPrompt(locale)<br/>──────────<br/>Define o papel da IA:<br/>'estrategista de emissões',<br/>regras de grounding,<br/>ordem de seções"]

    UserPrompt["buildUserPrompt(locale, prefs)<br/>──────────<br/>Serializa preferências em JSON<br/>estruturado com i18n"]

    Call["generateText() via Vercel AI SDK<br/>──────────<br/>Modelo: gemini-2.5-flash<br/>Modo: structured output<br/>Schema de saída: plannerReportSchema"]

    OutputVal["plannerReportSchema.parse()<br/>──────────<br/>Valida: 4-8 seções,<br/>2-6 itens por seção,<br/>título 6-120 chars"]

    Fallback["buildFallbackReport()<br/>──────────<br/>Template local usando<br/>dados do próprio usuário"]

    Result["PlannerGenerateSuccessPayload<br/>{schemaVersion, generatedAt,<br/>report, mode: 'ai'|'fallback'}"]

    Input --> Validate
    Validate -->|"válido"| SysPrompt
    Validate -->|"inválido"| Error400["400 Bad Request<br/>(RFC 9457 Problem Details)"]
    SysPrompt --> UserPrompt
    UserPrompt --> Call
    Call -->|"sucesso"| OutputVal
    Call -->|"falha (API key, timeout,<br/>schema inválido)"| Fallback
    OutputVal --> Result
    Fallback --> Result
```

### Detalhes que importam

1. **Structured Output**: não pedimos texto livre ao Gemini. Pedimos JSON que obedeça `plannerReportSchema`. O SDK usa function calling internamente para forçar o schema.

2. **Validação dupla**: a entrada do usuário é validada com Zod. A saída da IA também é validada com Zod. Nenhum dado não-validado cruza as fronteiras do sistema.

3. **Erros seguem RFC 9457**: respostas de erro usam o formato Problem Details (`type`, `title`, `status`, `detail`, `instance`, `requestId`). Veja `api-contract.ts`.

4. **i18n nos prompts**: `buildSystemPrompt('pt-BR')` gera instruções em português. Isso não é cosmético — o idioma do prompt afeta diretamente a qualidade da saída da IA.

---

## 8. Modelo de Dados

```mermaid
erDiagram
    users ||--o{ workspace_members : "pertence"
    users ||--o{ plans : "cria"
    users ||--o{ shared_reports : "compartilha"
    users ||--o{ sessions : "possui"
    users ||--o{ accounts : "autentica via"

    workspaces ||--o{ workspace_members : "contém"
    workspaces ||--o{ subscriptions : "paga via"
    workspaces ||--o{ workspace_invitations : "convida"
    workspaces ||--o{ plans : "agrupa"

    users {
        varchar id PK
        varchar email UK
        varchar role "user | admin"
        boolean banned
        timestamp createdAt
    }

    workspaces {
        serial id PK
        varchar slug UK
        varchar ownerUserId FK
        timestamp deletedAt "soft delete"
    }

    workspace_members {
        serial id PK
        int workspaceId FK
        varchar userId FK
        varchar role "owner | admin | member"
        timestamp deletedAt "soft delete"
    }

    plans {
        varchar id PK "UUID"
        varchar userId FK
        int workspaceId FK
        text preferences "JSON serializado"
        text report "JSON serializado"
        varchar mode "ai | fallback"
        int version
        varchar parentId FK "auto-ref versionamento"
        timestamp deletedAt "soft delete"
    }

    subscriptions {
        serial id PK
        int workspaceId FK
        varchar stripeCustomerId
        varchar status
        timestamp deletedAt "soft delete"
    }

    shared_reports {
        serial id PK
        varchar token UK "link público"
        varchar creatorUserId FK
        text reportJson
        timestamp deletedAt "soft delete"
    }

    stripe_events {
        serial id PK
        varchar stripeEventId UK
        varchar status "received | processed"
        text error "null se ok"
    }
```

### Decisões notáveis no modelo

| Decisão                                         | Raciocínio                                                                                                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plans.preferences` é `text` (JSON serializado) | Preferências são um snapshot imutável. Não precisamos fazer queries por campos internos. Serializar evita 15+ colunas.                                                                  |
| `plans.version` + `plans.parentId`              | Permite versionamento: gerar nova versão de um plano sem perder o original.                                                                                                             |
| `stripe_events.status`                          | Idempotência: antes de processar um evento Stripe, marcamos `received`. Se o processamento falha, `error` é preenchido. Re-entrega do webhook encontra o registro e sabe que já tentou. |
| `workspace_invitations.token`                   | Token opaco para convites. É o equivalente a um link tipo `app.com/invite?token=abc123`.                                                                                                |
| Todas as tabelas de negócio têm `deletedAt`     | INV-01.                                                                                                                                                                                 |

---

## 9. Camada de Segurança

A segurança é implementada em **camadas** (defense in depth). Cada camada opera independentemente:

```mermaid
graph TD
    subgraph Camada1["Camada 1 — Edge (proxy.ts)"]
        RL["Rate Limiting<br/>(Upstash ou memória)"]
        CSRF["Verificação de Origin<br/>(POST/PUT/PATCH/DELETE)"]
        CSP["Content Security Policy<br/>(nonce por requisição)"]
        SEC["Security Headers<br/>(X-Frame-Options,<br/>Strict-Transport-Security)"]
    end

    subgraph Camada2["Camada 2 — Autenticação"]
        BA["Better Auth<br/>(sessão, cookies, OAuth)"]
        ROLES["Verificação de Roles<br/>(admin vs user)"]
        SESSION["Sessão: 7d expiry,<br/>1d refresh"]
    end

    subgraph Camada3["Camada 3 — Aplicação"]
        ZOD["Validação Zod<br/>(toda entrada)"]
        SO["import 'server-only'<br/>(barreira de build)"]
        LOG["PII Redaction<br/>(emails → redacted_email)"]
    end

    subgraph Camada4["Camada 4 — Dados"]
        SD["Soft Delete<br/>(não destruir dados)"]
        ISO["Isolamento por Workspace<br/>(todo WHERE tem workspaceId)"]
    end

    Camada1 --> Camada2 --> Camada3 --> Camada4
```

**Por que rate limiting vem antes de auth**: se um atacante fizer brute-force no login, o rate limit o bloqueia sem que o request jamais toque o banco de dados. Isso evita amplificação de custo.

**CSRF**: para métodos mutáveis (POST/PUT/PATCH/DELETE), o proxy verifica que o header `Origin` ou `Referer` é um origin permitido. Se não for, retorna 403 imediatamente.

---

## 10. Guia de Navegação — "Preciso Mexer em X"

> _Use esta tabela quando receber uma task. Ela diz exatamente quais arquivos olhar._

| Preciso...                               | Comece por                                | Depois leia                                                 |
| ---------------------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Adicionar campo no formulário do planner | `src/lib/planner/schema.ts`               | `prompt.ts`, `generate-report.ts`, componente de formulário |
| Mudar o prompt da IA                     | `src/lib/planner/prompt.ts`               | `generate-report.ts` (para entender o fallback)             |
| Criar nova rota de API                   | `app/api/<recurso>/route.ts`              | `src/lib/logging.ts` (wrapping), `src/lib/http.ts` (error)  |
| Adicionar tabela no banco                | `src/db/schema/postgres.ts` + `sqlite.ts` | `types.ts`, `client.ts` (exportar), `pnpm db:schema-parity` |
| Mudar regras de auth                     | `src/lib/auth.ts`                         | `proxy.ts` (redirecionamentos), `app/api/auth/`             |
| Adicionar rota protegida                 | `app/(protected)/`                        | `proxy.ts` (verifica cookie de sessão)                      |
| Mexer em pagamentos                      | `src/lib/stripe-helpers.ts`               | `src/lib/stripe.ts`, `app/api/stripe/webhooks/`             |
| Adicionar tradução                       | `src/lib/messages.ts`                     | `src/content/landing.ts`, `src/lib/planner/prompt.ts`       |
| Debugar erro 500                         | Logs → busque pelo `requestId`            | `src/lib/logging.ts`, Sentry                                |
| Mexer em headers de segurança            | `proxy.ts`                                | `src/lib/security/`                                         |
| Adicionar feature flag                   | `src/components/experiments/`             | Painel do GrowthBook                                        |
| Rodar testes                             | `pnpm test` (Vitest)                      | `pnpm test:e2e` (Playwright)                                |

---

## 11. Modos de Falha e Debugging

> _O que vai quebrar, e como investigar._

### Falha: "O relatório não gera"

| Sintoma                    | Causa provável                   | Como investigar                                          |
| -------------------------- | -------------------------------- | -------------------------------------------------------- |
| 400 Bad Request            | Input inválido (Zod)             | Leia o campo `detail` do Problem Details na resposta     |
| 200 OK, `mode: 'fallback'` | Gemini falhou ou API key ausente | Verifique `GOOGLE_GENERATIVE_AI_API_KEY` no `.env.local` |
| 500 Internal Server Error  | Erro não-capturado               | Busque `requestId` nos logs ou no Sentry                 |
| 429 Too Many Requests      | Rate limit no proxy              | Espere `retryAfterSeconds` indicado no response          |

### Falha: "Não consigo logar"

| Sintoma                                                       | Causa provável                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Redirect infinito `/login` → `/login`                         | Cookie de sessão não está sendo setado (verifique `BETTER_AUTH_BASE_URL`) |
| "Missing BETTER_AUTH_SECRET"                                  | `.env.local` não configurado (copie `.env.example`)                       |
| Login funciona mas redirect vai para `/` em vez de `/planner` | Verifique `proxy.ts:hasBetterAuthSessionCookie()`                         |

### Falha: "Build quebra ao importar módulo de servidor"

| Sintoma                                    | Causa provável                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Module not supported in client component" | Um componente `'use client'` está importando (direta ou transitivamente) um módulo com `import 'server-only'`                                                      |
| **Como resolver**                          | Rastreie a cadeia de imports até encontrar o Client Component que importa o módulo server-only. Separe os dados (passe como props) ou crie um wrapper server-side. |

### Falha: "Schema parity check falha"

```bash
pnpm db:schema-parity  # Compara postgres.ts vs sqlite.ts
```

Se falha, significa que você editou `postgres.ts` mas esqueceu de replicar em `sqlite.ts` (ou vice-versa). É esperado — edite o outro arquivo para ficar em paridade.

---

## 12. Comandos Essenciais

### Primeiro Dia

```bash
# 1. Instalar
pnpm install

# 2. Configurar ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves

# 3. Criar banco local (SQLite)
pnpm db:push:sqlite
pnpm db:seed

# 4. Rodar
pnpm dev
# → http://localhost:3000
```

### Dia a Dia

| Comando                 | Quando usar                                          |
| ----------------------- | ---------------------------------------------------- |
| `pnpm dev`              | Desenvolvimento                                      |
| `pnpm lint`             | Antes de commitar                                    |
| `pnpm type-check`       | Depois de mudar tipos                                |
| `pnpm test`             | Testes unitários (Vitest)                            |
| `pnpm test:e2e`         | Testes end-to-end (Playwright)                       |
| `pnpm verify`           | Antes de abrir PR (lint + type + test + build + e2e) |
| `pnpm db:studio`        | Explorar banco visualmente                           |
| `pnpm db:schema-parity` | Depois de editar schema                              |

---

## 13. Glossário Preciso

| Termo                           | Definição exata neste projeto                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **App Router**                  | Sistema de roteamento do Next.js onde a estrutura de pastas em `app/` define as URLs. Não confundir com Pages Router (legado).                 |
| **Better Auth**                 | Biblioteca de autenticação usada. Gerencia sessões, OAuth, magic links e roles. Config em `src/lib/auth.ts`.                                   |
| **Client Component**            | Componente React executado no navegador. Requer `'use client'` no topo. Pode usar hooks (`useState`, `useEffect`). Não pode acessar DB.        |
| **Drizzle ORM**                 | ORM usado para queries tipadas. Gera SQL legível. Schema definido em `src/db/schema/`.                                                         |
| **Edge Runtime**                | Ambiente leve de execução JavaScript da Vercel. Usado por `proxy.ts`. NÃO tem acesso a APIs Node.js completas (sem `fs`, sem `child_process`). |
| **Fallback**                    | Relatório gerado localmente quando o Gemini falha. Indicado por `mode: 'fallback'` na resposta.                                                |
| **HoF (Higher-Order Function)** | Função que recebe ou retorna outra função. `withApiLogging()` é uma HoF — recebe seu handler e retorna um handler com logging.                 |
| **Invariante**                  | Propriedade que deve ser verdadeira em todos os estados. Seção 4 lista as invariantes deste sistema.                                           |
| **Lazy Singleton**              | Padrão onde o objeto (`db`) é criado na primeira chamada, não no import. Implementado via `Proxy` em `client.ts`.                              |
| **Magic Link**                  | Login via link clicável enviado por email. Sem senha. Expira em 5 minutos.                                                                     |
| **Problem Details**             | RFC 9457. Formato padrão para respostas de erro JSON: `{type, title, status, detail, instance}`. Veja `api-contract.ts`.                       |
| **Proxy**                       | Neste projeto, `proxy.ts` = pipeline de segurança que intercepta TODA requisição antes de chegar ao handler. NÃO é um proxy reverso.           |
| **Server Component**            | Componente React executado no servidor. Padrão no Next.js 16. Pode acessar DB diretamente. Não pode usar hooks de estado.                      |
| **Soft Delete**                 | Marcar registro com `deletedAt = now()` em vez de `DELETE FROM`. Obrigatório (INV-01).                                                         |
| **Structured Output**           | Modo do Gemini onde a IA é forçada a retornar JSON conforme um schema específico, em vez de texto livre.                                       |
| **Workspace**                   | Unidade de isolamento multi-tenant. Cada workspace tem seus próprios membros, planos e assinatura.                                             |
| **Zod**                         | Biblioteca de validação de schemas em runtime. Usada para validar entrada de API E saída da IA.                                                |

---

> **Quando estiver em dúvida sobre onde começar**: abra o arquivo de rota (`app/.../page.tsx` ou `app/api/.../route.ts`), siga os imports. Cada import te leva uma camada mais fundo. Rota → Lógica de Negócio → Dados. Essa é a espinha dorsal do sistema.
