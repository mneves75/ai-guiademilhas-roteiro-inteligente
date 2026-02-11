# Dashboards e Alertas

Este diretorio contem dashboards opcionais e regras de alerta baseadas no endpoint `/metrics`.

## Stack local (recomendado)

O repo ja inclui um stack local de observabilidade em `observability/`:

- Prometheus + Alertmanager + Grafana (com provisioning automatico)
- Dashboards em `grafana/dashboards/`
- Regras de alerta em `grafana/alerts/security-alerts.yaml`

Suba com:

```bash
docker compose -f observability/docker-compose.yml up -d
```

Detalhes: `observability/README.pt-br.md`.

## Prometheus (manual)

O app expoe `/metrics` em `app/metrics/route.ts`.

Boas praticas:

- Em producao, configure `METRICS_TOKEN` e scrapeie usando `Authorization: Bearer <token>`.
- Mantenha as series com baixa cardinalidade (as metricas deste repo sao contadores simples por "reason/outcome").

## Alertas

As regras em `grafana/alerts/security-alerts.yaml` sao formatadas como rules do Prometheus (nao sao "Grafana Managed Alerts").

Elas focam em sinais de abuso e regressao de hardening (CSRF/origin blocks, rate limiting em auth, redirects em paginas protegidas)
e em latencia p99 do proxy.
