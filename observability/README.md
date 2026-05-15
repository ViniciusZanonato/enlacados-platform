# Enlaçados — Observabilidade & SRE

Guia de operação para o time de infra (Paula / Igor) ativar o stack de
observabilidade em produção.

---

## 1. Health Endpoints disponíveis

| Serviço | Endpoint | Resposta esperada |
|---|---|---|
| FastAPI (python-core) | `GET /health` | `{"status":"ok","service":"enlacados-python-core","timestamp":"..."}` |
| Django (backend) | `GET /health/` | `{"status":"ok","service":"enlacados-django","db":"ok","timestamp":"..."}` |

Ambos são públicos (sem autenticação) e retornam HTTP 200 em estado saudável.
O endpoint Django retorna HTTP 503 se a conexão com o banco falhar.

---

## 2. Conectar Grafana Cloud ao endpoint de health check

Use o **Grafana Synthetic Monitoring** (antigo "Grafana Cloud Checks") para
fazer probes HTTP nos health endpoints.

### Passo a passo

1. Acesse **Grafana Cloud → Synthetic Monitoring → Add check**.
2. Escolha **HTTP** como tipo de check.
3. Configure os dois jobs:

```
Job name : enlacados-fastapi-health
URL      : https://<SEU_DOMINIO_FASTAPI>/health
Method   : GET
Frequency: 60s
Timeout  : 10s
Assert   : status code = 200
Assert   : JSON body path $.status = "ok"
```

```
Job name : enlacados-django-health
URL      : https://<SEU_DOMINIO_DJANGO>/health/
Method   : GET
Frequency: 60s
Timeout  : 10s
Assert   : status code = 200
Assert   : JSON body path $.db = "ok"
```

4. O Synthetic Monitoring publica automaticamente métricas `probe_success`
   no workspace Prometheus do Grafana Cloud.

### Importar o dashboard

1. Grafana Cloud → **Dashboards → Import**.
2. Faça upload de `observability/grafana-dashboard.json`.
3. Selecione a fonte de dados Prometheus do seu workspace.
4. Clique em **Import**.

---

## 3. Alerta: downtime > 2 minutos

Crie uma regra de alerta no Grafana Cloud:

```yaml
# Grafana Alerting → Alert Rules → New alert rule
Nome      : [Enlaçados] Serviço fora do ar
Expressão : probe_success{job=~"enlacados-.*"} == 0
For       : 2m          # aguarda 2 min antes de disparar
Labels    :
  severity: critical
  team    : sre
Anotações :
  summary    : "{{ $labels.job }} está fora do ar há mais de 2 minutos"
  description: "Probe {{ $labels.instance }} retornou 0 (DOWN)"
```

**Contact point** (notificação):
- Grafana Cloud → **Alerting → Contact points → Add contact point**
- Tipo: Slack / PagerDuty / e-mail — conforme canal do time
- Associe ao **Default notification policy**

---

## 4. Alerta: error rate > 5% de 5xx em 5 minutos

```yaml
Nome      : [Enlaçados] Alta taxa de erro 5xx
Expressão : |
  sum(rate(http_requests_total{status=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
  > 0.05
For       : 5m
Labels    :
  severity: high
  team    : sre
Anotações :
  summary    : "Taxa de erro 5xx acima de 5% nos últimos 5 minutos"
  description: "Valor atual: {{ $value | humanizePercentage }}"
```

> Nota: essa métrica depende de instrumentação Prometheus no FastAPI/Django.
> Para o FastAPI, instale `prometheus-fastapi-instrumentator` (veja secao 6).
> Para o Django, use `django-prometheus`.

---

## 5. Sentry DSN no frontend Vite (captura de erros JS)

### Instalar o SDK

```bash
npm install @sentry/react @sentry/tracing
```

### Configurar via variável de ambiente

Adicione ao `.env` (e aos secrets do GitHub Actions / Vercel):

```
VITE_SENTRY_DSN=https://<chave>@o<org>.ingest.sentry.io/<project-id>
```

### Inicializar no `src/main.tsx`

```tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,          // "production" | "development"
    tracesSampleRate: 0.2,                       // 20% de traces
    integrations: [Sentry.browserTracingIntegration()],
  });
}
```

O Sentry capturará automaticamente erros não tratados, rejeições de Promise
e erros de render do React.

---

## 6. Instrumentação Prometheus (métricas de latência/erro)

Para alimentar os painéis de latência e error rate do dashboard, instale:

**FastAPI:**
```bash
pip install prometheus-fastapi-instrumentator
```
```python
# python-core/main.py — após criar o app
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

**Django:**
```bash
pip install django-prometheus
```
```python
# settings.py — INSTALLED_APPS
"django_prometheus",

# MIDDLEWARE — primeiro e último
"django_prometheus.middleware.PrometheusBeforeMiddleware",
...
"django_prometheus.middleware.PrometheusAfterMiddleware",

# urls.py
path("", include("django_prometheus.urls")),  # expõe /metrics
```

Configure o Grafana Cloud Agent (ou Alloy) para fazer scrape de `/metrics`
nos dois serviços.

---

## 7. Variáveis de ambiente necessárias em produção

| Variável | Serviço | Descrição |
|---|---|---|
| `VITE_SENTRY_DSN` | Frontend | DSN do projeto Sentry |
| `SENTRY_DSN` | FastAPI / Django | DSN server-side (opcional) |
| `GRAFANA_CLOUD_API_KEY` | CI/CD | Para push de anotações de deploy |

---

## Contatos SRE

- Paula (SRE) — alertas de infra, dashboards
- Igor (DevOps Prod) — CI/CD, deploy pipelines
