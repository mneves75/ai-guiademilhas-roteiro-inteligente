# Web app de roteiros personalizados no estilo Viaja Lulu

## Resumo executivo

O que o site da entity["organization","Viaja Lulu","roteiros de viagem br"] vende hoje não é apenas “um roteiro”, mas um pacote de valor bem definido: atrações organizadas por dia e por proximidade, conteúdo editorial (história e curiosidades), mapas prontos para abrir no celular, links de ingressos e dicas de hospedagem; além de upsells como uma assistente de IA via entity["company","WhatsApp","messaging app"] e encontros em entity["company","Google Meet","video conferencing"]. citeturn16view0 O produto também tem conta/login para “acessar minhas compras”, sugerindo uma camada de pós-venda e entrega de conteúdo digital. citeturn16view1turn16view0

Para criar um **web app** que gere roteiros personalizados “a partir de escolhas iniciais”, o risco central é tentar construir cedo demais um “super-app de viagem” com inventário transacional (voos/hotéis/ingressos). APIs comerciais grandes tendem a exigir parceria e onboarding, e algumas são instáveis por mudanças de programa (ex.: o portal self‑service da entity["company","Amadeus","travel tech company"] tem aviso de descontinuação em 17 de julho de 2026). citeturn18search2

**Recomendação prática (opinião, baseada em risco e custo):** separar o problema em duas camadas e atacar na ordem certa.

- **Camada A (MVP):** um “motor de organização e personalização” que gera uma agenda dia-a-dia com mapa, tempo de deslocamento e descrições curtas, sempre com **edição manual** e “travamento” de itens. Isso captura a maioria do valor percebido do produto (proximidade + roteiro diário + informações úteis). citeturn16view0
- **Camada B (depois):** integrações transacionais (hotéis/voos/tours) só quando você tiver volume, tese de monetização e capacidade de negociar parceiros. Isso evita construir para dependências que podem negar acesso ou impor limites/termos restritivos. citeturn4search9turn4search12turn4search26turn17search1turn18search2

Premissas que **não foram especificadas** e mudam a arquitetura/custo: público-alvo (B2C vs B2B), geografia prioritária (Brasil, Europa, global), idiomas, necessidade de multi-destino, necessidade de reservas dentro do app, e volume esperado de requisições.

## Produto e UX

### O que “parece simples” no marketing e vira requisito duro no produto

O discurso “roteiro personalizado” frequentemente esconde três requisitos técnicos e de UX que definem sucesso ou fracasso:

- **Proximidade e deslocamento**: organizar por dia “sem ficar indo e voltando” é basicamente um problema de roteirização e clusterização com restrições. A entity["organization","Viaja Lulu","roteiros de viagem br"] enfatiza explicitamente esse benefício. citeturn16view0
- **Conteúdo confiável**: “história e curiosidades” implica base editorial própria ou uma estratégia de fontes abertas/comerciais, com normalização e revisão. citeturn16view0
- **Entrega e pós-venda**: login, acesso a compras e bônus (assistente por 30 dias) são produto, não “detalhe”. citeturn16view1turn16view0

### Funcionalidades essenciais do web app

**Onboarding (fluxo inicial)**

1. Destino (cidade ou região) e datas (ou número de dias).
2. Estilo e restrições: orçamento (faixa), ritmo (leve/intenso), interesses (arte, gastronomia, natureza etc.), mobilidade (a pé/transporte/carro), acessibilidade, crianças, preferências alimentares.
3. “Âncoras”: hotel/bairro (se já tiver), atrações obrigatórias, horários indisponíveis.
4. Geração do roteiro com feedback visual de progresso e explicação do “porquê” de cada escolha (transparência aumenta confiança, reduz sensação de aleatoriedade).

**Por que o onboarding precisa ser progressivo (fato + implicação)**: questionários longos derrubam conversão; “progressive disclosure” reduz carga cognitiva ao mostrar apenas o necessário por etapa. citeturn19search4turn19search0

**Filtros e níveis de personalização**

- Nível básico: escolher categorias e ritmo.
- Nível intermediário: janelas de tempo, limite de deslocamento por dia, preferências de horário (manhã/tarde/noite).
- Nível avançado: travar itens, “otimizar novamente sem mexer no que está travado”, tolerância a filas, evitar áreas (quando suportado por API), e regras como “no máximo 1 museu por dia”.

**Editor manual do roteiro**

- Reordenar (drag and drop) e “travamento” de atividades.
- Inserir atividade customizada (manual) com endereço ou pin no mapa.
- Ajustar duração estimada, horário e notas pessoais.
- Botão “recalcular deslocamentos” e “reotimizar dia” (apenas o dia, não a viagem toda).

**Exportação e compartilhamento**

- Link público do roteiro (somente leitura) com controle de privacidade.
- PDF e modo “imprimir”.
- Exportar agenda (ICS) e lista/mapa para navegação no celular (o valor de “clique e siga o trajeto” é central no benchmark). citeturn16view0
- Compartilhar com coautores (viagem em grupo) com controle de permissões.

**Microinterações e mobile-first**

- Indicadores de progresso e loaders consistentes para a geração (especialmente se houver chamadas a múltiplas APIs e/ou LLM). citeturn19search3turn19search7
- Estados “offline/degradado”: se a API de eventos falhar, o app ainda precisa entregar um roteiro coerente.
- WCAG 2.2 como meta mínima de acessibilidade; há tradução pt-BR oficial. citeturn19search18turn19search22

### Diagrama do fluxo do usuário

```mermaid
flowchart TD
  A[Landing] --> B[Onboarding por etapas]
  B --> C{Dados mínimos OK?}
  C -- não --> B
  C -- sim --> D[Geração de roteiro (job)]
  D --> E[Visualizar roteiro: timeline + mapa]
  E --> F[Editar manualmente: arrastar, travar, adicionar]
  F --> G{Reotimizar?}
  G -- dia --> D
  G -- não --> H[Exportar/compartilhar]
  H --> I[Salvar como template / copiar viagem]
  E --> J[Upsell: recursos premium]
```

## Fontes de dados e integrações

### Observação crítica antes das tabelas

“Roteiro personalizado” exige, no mínimo: (a) base de POIs (lugares), (b) roteamento/distâncias/tempos, (c) horários e sazonalidade (clima + eventos), (d) conteúdo descritivo, e (e) termos de uso que permitam cache e reuso. A maior armadilha é escolher APIs sem ler restrições de armazenamento/uso, o que depois quebra features como “salvar roteiros” e “mapas offline”.

### Tabela comparativa de APIs e provedores

| Categoria                              | Provedor                                                             | Cobertura geográfica                                                                                              | Dados oferecidos                                                                                                            | Custo (referência)                                                                                                                                                                                                               | Limitações relevantes                                                                                                                                                                                                                                                                          |
| -------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mapas/Rotas/Places (comercial)         | entity["company","Google Maps Platform","maps api platform"]      | Lista de preços global (há página separada para Índia) citeturn13view0                                         | Maps (Dynamic/Static), Routes (Compute Routes/Matrix), Places (Autocomplete, Geocoding etc.) citeturn13view0             | Ex.: Autocomplete: 10.000 eventos grátis e depois US$ 2,83/1000 (tier inicial); Compute Routes Essentials: 10.000 grátis e depois US$ 5/1000; Dynamic Maps: 10.000 grátis e depois US$ 7/1000 (tier inicial). citeturn13view0 | Desde 1º mar 2025, o crédito mensal de US$ 200 foi substituído por franquias grátis por SKU. citeturn20search7turn20search2 Termos/uso e mudanças de portfólio (serviços “legacy”) podem impactar integrações. citeturn0search12                                                        |
| Mapas/Geocoding/Directions (comercial) | entity["company","Mapbox","map apis company"]                     | Não especificado                                                                                                  | Geocoding (forward/reverse), Directions (rotas), Map Matching, Matrix etc. citeturn20search1turn21search2turn20search5 | Pay-as-you-go; Geocoding tem menção de free tier de 100.000 requests/mês em material público. citeturn21search5turn21search0 Static Images: grátis até 50k/mês e depois US$ 1/1000. citeturn21search9                     | Geocoding: limite padrão 1000 req/min e resultados “somente com Mapbox map”. citeturn20search1 Directions: até 25 coordenadas por request. citeturn21search2 Rate limits variam por API (ex.: Directions 300 req/min). citeturn20search5                                              |
| Geocoding e tiles (aberto)             | entity["organization","OpenStreetMap Foundation","osm nonprofit"] | Global (base OSM), mas qualidade varia por região (inferência)                                                    | Geocoding via Nominatim; tiles padrão; dados sob ODbL citeturn5search0turn5search1                                      | Gratuito (infra comunitária)                                                                                                                                                                                                     | Nominatim público: “no heavy uses”, máximo absoluto 1 req/s, exige User-Agent/Referer e atribuição. citeturn5search0 Tiles: política de cache e TTL mínimo (ex.: 7 dias) e restrições de uso. citeturn5search1 Para escala, tende a exigir infra própria ou provedor comercial de tiles. |
| Roteamento (aberto com quotas)         | entity["organization","openrouteservice","routing api by heigit"] | Global (base OSM)                                                                                                 | Directions, isochrones, matrix, optimization, geocoding e POIs citeturn7search2turn7search6                             | Plano Standard: €0; limites diários e por minuto definidos publicamente. citeturn7search2                                                                                                                                     | Quotas: ex. Directions 2.000/dia e 40/min; Geocoding 1.000/dia e 100/min; Optimization 500/dia e 40/min. citeturn7search2 Restrições técnicas: até 50 waypoints etc. citeturn7search6                                                                                                    |
| Places/POI (comercial)                 | entity["company","Foursquare","places api provider"]              | 200+ países e 100M+ POIs (afirmação do provedor) citeturn14search24                                            | Search, details, autocomplete; campos premium (fotos, tips etc.) citeturn15view0turn14search12                          | Pricing por CPM: Pro 0–10k calls grátis e depois US$ 15 CPM (10k–100k); Premium começa em US$ 18,75 CPM (0–100k). citeturn15view0                                                                                             | Separação Pro vs Premium muda custo; endpoints e campos determinam tier. citeturn14search12turn15view0                                                                                                                                                                                     |
| Places/Geocoding/Routing (comercial)   | entity["company","Geoapify","location api provider"]              | Não especificado                                                                                                  | Places, geocoding, routing, isolines etc. citeturn14search29                                                             | Modelo por “créditos”; Free plan inclui 3000 créditos/dia. citeturn14search9turn14search1 Places: cada 20 lugares retornados custa 1 crédito. citeturn14search13                                                          | Custo depende de parâmetros (limit/quantidade). citeturn14search13 Adequado para MVP, mas precisa governança de consumo.                                                                                                                                                                    |
| Eventos (comercial)                    | entity["company","Ticketmaster","event ticketing company"]        | Cobertura por países (EUA, Canadá, México, Austrália, NZ, Reino Unido, Irlanda, Europa etc.) citeturn22search0 | Busca de eventos, venues, atrações etc. citeturn22search0                                                                | Não especificado                                                                                                                                                                                                                 | Rate limits padrão: 5.000 calls/dia e 5 req/s; deep paging até o item 1000. citeturn22search0turn22search2                                                                                                                                                                                 |
| Eventos (comercial)                    | entity["company","Eventbrite","event management platform"]        | Não especificado                                                                                                  | API de eventos e recursos associados citeturn22search3                                                                   | Não especificado                                                                                                                                                                                                                 | Rate limits padrão: 2.000 calls/hora e 48.000/dia (documentação). citeturn22search1 Termos/ajustes podem impor limites menores dependendo de ações/token. citeturn22search9                                                                                                              |
| Clima (comercial)                      | entity["company","OpenWeather","weather api provider"]            | Global (inferência)                                                                                               | Weather/forecast e APIs relacionadas citeturn2search3                                                                    | Free: 1.000 calls/dia (Current Weather e 3‑hour Forecast). citeturn2search3                                                                                                                                                   | Plano gratuito tem limite diário; para escala, precisa plano pago e cache agressivo. citeturn2search3                                                                                                                                                                                       |
| Conteúdo e conhecimento (aberto)       | entity["organization","Wikidata","knowledge graph"]               | Global (inferência)                                                                                               | SPARQL endpoint; base estruturada de entidades                                                                              | Gratuito                                                                                                                                                                                                                         | Limites operacionais: timeout e limite de 5 consultas paralelas por IP (user manual). citeturn14search7 Requer otimização de queries em casos complexos. citeturn14search15                                                                                                              |

### Inventário comercial e transações: por que não é para MVP “por padrão”

A camada de inventário (hotéis/voos) costuma impor restrições contratuais, rate limits específicos e requisitos de parceria. Exemplos:

- entity["company","Booking.com","travel booking site"]: a Demand API é apresentada com requisitos de “Managed Affiliate Partner”, e o rate limiting existe, mas o limite exato pode depender do gerente de conta. citeturn4search12turn17search1
- entity["company","Expedia Group","travel company"]: o programa Rapid API é uma solução de parceria para acesso a inventário e fluxo de booking. citeturn4search9turn4search5
- entity["company","Skyscanner","travel metasearch"]: acesso via application/review para chave de API. citeturn4search26turn4search6
- entity["company","Duffel","travel api provider"]: possui modelo e pricing próprios, incluindo cobrança por excesso de “search to book ratio”. citeturn4search3
- entity["company","Amadeus","travel tech company"]: existe aviso oficial de descontinuação do portal self-service em 17 de julho de 2026. citeturn18search2

Em outras palavras: se o seu produto inicial depende de “reservar dentro do app”, você está assumindo um risco de cronograma e acesso (não especificado) muito maior do que “gerar e editar um roteiro excelente”.

## Modelos de recomendação e geração de itinerários

### Três abordagens e quando usar cada uma

**Heurísticas (rápidas, previsíveis, boas para MVP)**

- Seleção de candidatos: filtrar POIs por categoria/interesse, popularidade, avaliação (quando disponível) e distância do “centro” do roteiro.
- Agrupamento por dia: clusterização geográfica (ex.: k-means / grid / bairros), depois ordenação por proximidade.
- Regras: “não repetir categoria”, “limitar deslocamento diário”, “inserir almoço/jantar” etc.  
  Essa estratégia implementa o “selecionadas por proximidade” que o benchmark usa como benefício principal. citeturn16view0

**Otimização (qualidade alta, custo computacional maior, aparece quando as restrições crescem)**

- O problema vira uma variação de VRP/TSP: “otimizar rotas visitando um conjunto de locais sob restrições”. citeturn8search0turn8search4
- Ferramentas: entity["organization","OR-Tools","google optimization library"] define VRP e ressalta a complexidade (cresce rapidamente com tamanho do problema). citeturn8search4turn8search0
- Motores: entity["organization","VROOM","vrp optimization engine"] resolve VRP rapidamente e é open source. citeturn8search1

**IA/LLMs (excelentes para linguagem, frágeis para restrições duras)**

- Uso recomendado: gerar **texto** (resumos, explicações, “história e curiosidades”), adaptar tom, fazer perguntas de esclarecimento no onboarding, e sintetizar recomendações a partir de resultados reais (RAG).
- Uso arriscado: deixar o LLM “inventar” o roteiro sem motor determinístico. Isso tende a quebrar horários, distâncias e disponibilidade, e gera alucinações difíceis de auditar (risco de confiança do usuário).
- Custos: modelos têm preços por token; por exemplo, a página oficial de preços da OpenAI lista valores por 1M tokens para diferentes modelos, incluindo “input” e “output”. citeturn12view0

### Sistema híbrido recomendado

**Recomendação (opinião):** um sistema híbrido dá o melhor tradeoff entre qualidade percebida e controle.

1. **Gerador de candidatos (determinístico)**
   - consulta fontes de POI e eventos (tabela acima), aplica filtros do usuário, remove inconsistências.
2. **Ranker (híbrido)**
   - combina score semântico (embedding/vector search) com features estruturadas (distância, categoria, horário).
   - Vetor em banco: entity["organization","pgvector","postgres vector extension"] é extensão de similaridade vetorial em Postgres e pode armazenar embeddings. citeturn10search5turn10search1
3. **Planner (otimização leve)**
   - monta dias e ordem; usa roteamento para recalcular tempos.
4. **LLM “explicador e redator”**
   - gera as descrições e contexto (o que ver, por que faz sentido hoje, links e avisos).
5. **Editor manual como escape hatch**
   - usuário trava e ajusta; o sistema respeita travas e recalcula o restante.

## Arquitetura técnica e stack

### Arquitetura de referência

Objetivo: separar **experiência interativa** (onboarding e editor) de **trabalhos pesados** (ingestão, geração e reotimização), além de controlar custos de APIs externas com cache e filas.

```mermaid
flowchart LR
  U[Usuário (mobile/desktop)] --> FE[Front-end Web]
  FE --> API[Backend API]
  API --> AUTH[Auth/Session]
  API --> DB[(Banco relacional + geodados)]
  API --> CACHE[(Cache)]
  API --> JOBS[Fila/Workers]
  JOBS --> PLAN[Itinerary Engine]
  PLAN --> MAPS[APIs de mapas/rotas]
  PLAN --> POI[APIs de POIs]
  PLAN --> EVT[APIs de eventos]
  PLAN --> WX[API de clima]
  PLAN --> LLM[LLM Provider]
  API --> OBS[Logs/Métricas/Tracing]
```

**Componentes chave**

- Banco com geoespacial: entity["organization","PostGIS","postgres geospatial ext"] adiciona tipos/índices/queries geoespaciais ao entity["organization","PostgreSQL","database system"]. citeturn10search0turn10search8
- Vetores (para RAG e similaridade): entity["organization","pgvector","postgres vector extension"]. citeturn10search5
- Jobs assíncronos: geração pode levar segundos e depender de rate limits; tratar como job (com progresso) evita travar UI.

### Tabela comparativa de opções de stack

| Stack   | Front-end                                                                           | Back-end                                                                                            | Dados                                                             | Prós                                                                                                                   | Contras                                                                                                                                     |
| ------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack A | entity["company","Vercel","web hosting platform"] (deploy) + app web “React/SSR” | API serverless/edge + workers                                                                       | entity["company","Supabase","backend as a service"] (Postgres) | Velocidade de entrega; infra gerenciada; bom para MVP e iteração rápida. citeturn9search0turn9search1              | Risco de custo com picos e limites de plano; lock-in de plataforma e observabilidade mais “opinionated”. citeturn9search5turn9search9   |
| Stack B | SPA/SSR em qualquer CDN                                                             | API em containers serverless (ex.: entity["company","Google Cloud Run","serverless containers"]) | Postgres gerenciado + Redis (não especificado)                    | Escala previsível por container; paga por uso com granularidade; separa bem workers. citeturn9search2turn9search18 | Mais DevOps do que Stack A; tuning de cold start, concorrência e rede; mais peças para operar. citeturn9search2turn9search18            |
| Stack C | Web app + PWA                                                                       | API + motor de rotas self-host (OSRM/VRP)                                                           | Postgres + índices/filas                                          | Custo variável menor em escala se você controlar infra; não depende de quotas de roteamento de terceiros (opinião).    | Alto custo inicial de engenharia/operar dados de mapas; atualização de dados e SRE viram parte do produto. citeturn8search2turn5search1 |

**Sugestão de stack (opinião):** começar na Stack A ou B. A Stack C só faz sentido quando custo de APIs externas ou restrições contratuais se tornam o gargalo real (não especulado, precisa métricas).

## Requisitos não funcionais, segurança e privacidade

### Performance e escalabilidade

- Rate limits são regra, não exceção: eventos e eventos/places têm quotas explícitas (ex.: entity["company","Ticketmaster","event ticketing company"] 5.000/dia; entity["company","Eventbrite","event management platform"] 2.000/hora). citeturn22search0turn22search1
- Em mapas/rotas, o controle de custo vem de cache e redução de chamadas: no entity["company","Google Maps Platform","maps api platform"], preços são por SKU e por 1000 eventos, com franquias grátis por SKU. citeturn13view0turn20search7
- Para OSM público, políticas limitam uso pesado e exigem cache adequado (ex.: TTL mínimo em tiles; 1 req/s no Nominatim). citeturn5search0turn5search1

### Segurança (web + genAI)

- OWASP Top 10 permanece útil como checklist (ex.: Broken Access Control e componentes vulneráveis). citeturn3search19turn3search23
- Para recursos com LLM, vale mapear riscos específicos de GenAI (projeto OWASP para segurança de GenAI/LLMs). citeturn3search35
- Controles mínimos: autenticação forte, autorização por papel (owner/editor/viewer), CSRF, rate limiting interno, proteção de chaves de API, e logs com dados pessoais minimizados.

### LGPD/GDPR: implicações práticas

- A base legal e deveres dependem do que você coleta e por quê; mas o app naturalmente lida com dados potencialmente sensíveis (preferências, localização, datas de viagem). A lei brasileira (LGPD) e o regulamento europeu (GDPR) estabelecem obrigações e princípios de proteção de dados. citeturn3search16turn3search21turn3search17
- A entity["organization","ANPD","brazil data protection authority"] publicou guias sobre hipóteses legais (ex.: legítimo interesse) que afetam decisões de produto como cookies, analytics e personalização. citeturn3search18

**Recomendação (opinião) para reduzir risco jurídico e de confiança:**  
coletar o mínimo (não pedir documento, passaporte etc. no MVP), permitir uso sem conta (roteiro “rápido”), e só persistir dados com consentimento claro e controles de exclusão/exportação.

## Monetização, roadmap, custos e riscos

### Monetização: opções e tradeoffs

A entity["organization","Viaja Lulu","roteiros de viagem br"] monetiza por venda de roteiros (unitário e combo), com bônus e assistente via entity["company","WhatsApp","messaging app"]; há evidência de checkout via entity["company","Hotmart","digital products checkout"] e de acesso pós-compra por login. citeturn16view0turn16view1

Modelos possíveis para seu app:

- **Freemium**: gerar 1 roteiro básico grátis; cobrar por exportação, multi-destino, colaboração e “reotimizações ilimitadas”.
- **Assinatura**: ideal se o usuário planeja várias viagens/ano; exige retenção com biblioteca de viagens, templates e atualizações.
- **Afiliados/parcerias**: hotéis/ingressos podem gerar receita, mas dependem de programas e termos; risco de priorizar conversão e degradar qualidade. (opinião)
- **Venda de “pacotes editoriais”**: replicar a vantagem de curadoria, mas com personalização por módulos (mais simples que inventário transacional).

### Roadmap sugerido com marcos e estimativas de esforço

Como o tamanho do time é **não especificado**, abaixo vai uma estimativa em “semanas‑pessoa” (SP) para um time enxuto.

**MVP funcional (6 a 10 SP)**

- Onboarding por etapas + geração básica por proximidade (2–3 SP).
- Visualização timeline + mapa + cartões de atrações (2 SP).
- Editor manual (reordenar, travar, inserir custom) (2–3 SP).
- Exportação (link e PDF simples) (1–2 SP).
- Observabilidade e rate limiting interno (1 SP).

**Beta pública (8 a 14 SP adicionais)**

- Qualidade de POI (dedupe/normalização) e cache (2–3 SP).
- Integração de eventos (ex.: entity["company","Ticketmaster","event ticketing company"]/entity["company","Eventbrite","event management platform"]) com fallback (2 SP). citeturn22search0turn22search1
- Clima e avisos de sazonalidade (1 SP). citeturn2search3
- Sistema híbrido com embeddings (pgvector) e LLM para descrições (3–5 SP). citeturn10search5turn12view0
- Acessibilidade WCAG 2.2 AA como meta (1–2 SP). citeturn19search2turn19search18

**V1 comercial (variável, 10+ SP)**

- Multi-destino, colaboração, templates, e camada de pagamentos/planos.
- Integrações comerciais só se houver negociação e compliance.

### Custos estimados

Custos variam fortemente por volume e escolhas de APIs. Um jeito mais honesto é separar **fixos** e **variáveis**.

**Fixos típicos (MVP)**

- Banco gerenciado: entity["company","Supabase","backend as a service"] tem plano Pro a partir de US$ 25/mês (referência oficial de pricing). citeturn9search0
- Hosting: entity["company","Vercel","web hosting platform"] tem planos com regras de uso e cobrança por assentos e consumo; há documentação de que o Pro é cobrado por assentos/add-ons e inclui crédito de uso. citeturn9search5turn9search13
- Alternativa: entity["company","Google Cloud Run","serverless containers"] cobra por recursos usados (arredondamento em 100ms) e tem modelos request-based/instance-based. citeturn9search2turn9search18

**Variáveis dominantes**

- Mapas/places: custos por evento e por SKU no entity["company","Google Maps Platform","maps api platform"] (ex.: preços por 1000 eventos e franquias grátis). citeturn13view0turn20search7
- LLM: preços oficiais por 1M tokens variam por modelo (ex.: “GPT‑5 mini” com input e output precificados separadamente na página oficial). citeturn12view0
- Eventos: quotas podem ser o gargalo antes do custo (ex.: 5.000/dia em entity["company","Ticketmaster","event ticketing company"]). citeturn22search0

**Regra prática (opinião):** no MVP, limite chamadas externas por usuário por meio de cache, sessões (autocomplete) e geração assíncrona; isso reduz custo e melhora confiabilidade.

### Riscos e mitigação

- **Risco: dependência de fornecedor que muda programa/fecha acesso.** Exemplo concreto: o portal self-service da entity["company","Amadeus","travel tech company"] tem aviso de descontinuação em 17 de julho de 2026. citeturn18search2  
  Mitigação: evitar dependência no MVP; desenhar camada de abstração de provedores e plugabilidade.

- **Risco: termos de uso impedirem cache/armazenamento e quebrarem “salvar roteiros”.** Ex.: Mapbox afirma que geocodes só podem ser usados com Mapbox map; OSM exige atribuição e tem políticas restritivas de uso comunitário. citeturn20search1turn5search0turn5search1  
  Mitigação: ler termos no design; armazenar só IDs e metadados permitidos; manter rastreabilidade de origem/licença por item.

- **Risco: usuário não confia no roteiro “automático”.**  
  Mitigação: explicabilidade (“por proximidade”, “por horário de funcionamento”), botão de reotimização local, e editor manual como primeira classe.

- **Risco: alucinações de IA virarem erro de viagem (alto impacto).**  
  Mitigação: LLM apenas para texto e síntese baseada em dados recuperados; bloquear saída fora de schema; rotular informações incertas; manter logs e avaliação.

- **Risco: custo explode com autocomplete e mapas.**  
  Mitigação: usar sessões e field masks quando disponíveis no provedor; cache; limitar requisições por digitação; e revisar pricing por SKU. citeturn13view0turn14search28turn20search1

**Próximos passos (priorizados, opinião)**

1. Definir escopo que não está especificado: geografia inicial, público-alvo e se haverá compra dentro do app.
2. Prototipar UX do onboarding + editor (antes de qualquer LLM) e validar se o usuário entende e confia no roteiro.
3. Implementar MVP com uma combinação “POI + roteamento + mapa”, com cache e job assíncrono.
4. Só depois adicionar LLM para conteúdo editorial e uma assistente estilo “concierge” (parecido com o bônus de WhatsApp do benchmark). citeturn16view0

Autocrítica: eu deveria ter quantificado com mais rigor um cenário de custo mensal completo (com hipóteses numéricas de usuários, mapas, rotas e sessões de autocomplete), mas isso exigiria parâmetros de volume e de geografia que não foram especificados e mudam ordens de grandeza. Melhoraria também incluindo um exemplo concreto de schema (tabelas/entidades) e uma matriz de “direitos de armazenamento” por provedor, porque termos de uso são o ponto que mais destrói features depois que o produto cresce.
