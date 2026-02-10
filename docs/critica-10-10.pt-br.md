# Critica 10/10 (Primeiros Principios) e Padroes de Industria

Atualizado: 2026-02-10

Este documento existe para "Carmack review": justificar escolhas por invariantes, reduzir classes inteiras de falhas e manter verificabilidade operacional.

## 1) O problema (primeiros principios)

Se um fluxo critico (auth) falha em E2E por "timing", o problema nao e o teste: e arquitetura.

Invariantes desejadas:

- Parametros de URL (callbackUrl, token) devem ser normalizados no server e vir como props estaveis para o client.
- Locale nao pode depender de `useEffect`/DOM para existir no primeiro render.
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

Comandos:

- E2E completo: `PW_FULL=1 pnpm test:e2e`
- Auditoria local: `pnpm security:audit`

## 4) O que falta para 10/10 operacional (depende de deploy real)

- DAST automatico em preview/prod precisa de `deployment_status.target_url` (ou `environment_url`) no GitHub Actions.
- Rate limit "hard" em producao: configurar store compartilhado (Upstash) quando multi-instancia/serverless.
- Observabilidade real: conectar Prometheus/Alertmanager/Grafana no ambiente (tokens, scrape, alert routes).

## 5) Melhorias futuras (opcionais, mas "elite")

- CSP reporting (`report-to`) + coleta de violacoes.
- Assinar `security.txt` (OpenPGP) e monitorar integridade (recomendado pela RFC).
- Checklist ASVS versionado (IDs + evidencias) como criterio de release.
