# Observabilidade (local)

Stack: Prometheus + Alertmanager + Grafana, usando o endpoint `/metrics` do app.

## Subir o stack

1. Inicie o app em outro terminal:

```bash
pnpm dev
```

2. Suba Prometheus/Grafana/Alertmanager:

```bash
docker compose -f observability/docker-compose.yml up -d
```

## Acessos

- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
- Grafana: `http://localhost:3001` (user/pass: `admin`/`admin` por padrao)

## Token do /metrics (recomendado em prod)

O endpoint `app/metrics/route.ts` aceita:

- `Authorization: Bearer <METRICS_TOKEN>` (preferido)
- `x-metrics-token: <METRICS_TOKEN>` (legado)

Para testar local com token:

```bash
export METRICS_TOKEN='um-token-aleatorio'
docker compose -f observability/docker-compose.yml up -d --force-recreate prometheus
```

## Alertas

As regras em `grafana/alerts/security-alerts.yaml` sao carregadas pelo Prometheus (montadas via compose).

Inclui alertas de funil do planner:

- `AppPlannerFallbackRatioHigh`: alerta quando fallback domina as geracoes (possivel degradacao da IA).
- `AppPlannerLandingSourceDrop`: alerta quando a origem `landing_planner` zera, apesar de haver geracoes no periodo.

Verifique em:

- `http://localhost:9090/rules`
- `http://localhost:9090/alerts`

## Ajustar alvo do app (se necessario)

Por padrao o Prometheus tenta scrapear `host.docker.internal:3000`.

Se seu app estiver em outra porta/host:

```bash
export APP_METRICS_TARGET='host.docker.internal:3002'
docker compose -f observability/docker-compose.yml up -d --force-recreate prometheus
```
