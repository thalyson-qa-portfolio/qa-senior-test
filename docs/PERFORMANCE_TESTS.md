# Documentacao: Testes de Carga com K6

## Visao Geral

Este documento descreve os testes de performance (carga) do projeto, implementados com **K6** para atender a **Atividade 4** do teste tecnico (opcional): simular carga em API publica com metricas e analise de resultados.

**Importante:** Os testes de API funcionais continuam na **Restful-Booker** (`tests/api/`). O script de carga usa a API publica **test.k6.io**, mantida pelo time do K6 para testes de performance, evitando rate limiting e respostas inconsistentes sob carga pesada.

---

## Requisitos do Exercicio

### Tarefa 1

- Teste de carga basico em API publica (pode ser mock ou API dedicada a testes)
- **500 usuarios simultaneos por 5 minutos** (mantidos apos ramp-up)

### Tarefa 2

- Relatorio de teste de carga e analise do resultado

### Criterios de Avaliacao

| Criterio | Como foi atendido |
|----------|-------------------|
| Qualidade do script | Script em `performance/load-test.js`: stages, checks, thresholds, metricas customizadas, summary em texto |
| Uso correto de metricas | `http_req_duration`, `http_req_failed`, `http_reqs`, `vus`, `iterations`, `Rate`, `Trend` |
| Identificacao de gargalos | Secao **Analise** abaixo + comparacao media vs P95 vs maximo |

---

## Arquivo e Configuracao

| Arquivo | Descricao |
|---------|-----------|
| `performance/load-test.js` | Script K6 principal |

### Variaveis de ambiente (`__ENV`)

O script le parametros via **`__ENV`** (passar com `k6 run -e CHAVE=valor` ou `export` antes do comando). Valores por defeito mantem o cenario original (500 VUs, ~7 min, test.k6.io).

| Variavel | Default | Descricao |
|----------|---------|-----------|
| `K6_BASE_URL` | `https://test.k6.io` | Origem HTTP (sem barra final) |
| `K6_RAMP_DURATION` | `1m` | Duracao ramp-up |
| `K6_LOAD_DURATION` | `5m` | Platô de carga |
| `K6_RAMP_DOWN_DURATION` | `1m` | Ramp-down |
| `K6_TARGET_VUS` | `500` | VUs alvo no platô |
| `K6_VUS` | (usa `K6_TARGET_VUS`) | Alias opcional de VUs (se `K6_TARGET_VUS` estiver vazio, vale este) |
| `K6_SLEEP_S` | `1` | Pausa em segundos entre passos dentro de cada iteracao |
| `K6_P95_MS` | `2000` | Limite do threshold `http_req_duration` (p95) |
| `K6_HTTP_FAIL_RATE_MAX` | `0.1` | Limite max. da taxa de falha HTTP |
| `K6_ERRORS_RATE_MAX` | `0.1` | Limite max. da taxa da metrica customizada `errors` |

Exemplo (so altera URL, mantem o resto):

```bash
k6 run -e K6_BASE_URL=https://test.k6.io performance/load-test.js
```

### GitHub Actions (Variables do repositorio)

No repositorio: **Settings → Secrets and variables → Actions → Variables**. Use **o mesmo nome** das variaveis `K6_*` da tabela. O job `performance-tests` em [`.github/workflows/tests.yml`](../.github/workflows/tests.yml) passa `vars.K6_*` para o processo do K6. **Nao e obrigatorio** cadastrar nada: se a variable nao existir ou estiver vazia, o script usa os **defaults** da tabela.

**Nota (CI smoke):** o comando `npm run test:perf:smoke:ci` usa **`--vus 10 --duration 30s`**, o que **sobrepõe** os `stages` do script. No CI, as variables ajustam sobretudo **URL**, **sleep** e **thresholds**; ramp/load/VUs do script **nao** governam essa execução. Para usar **stages** e VUs por env, corre localmente `npm run test:perf` ou `k6 run -e ... performance/load-test.js` **sem** `--vus`/`--duration` na CLI.

**Integracao CI:** **Node 20**, `npm ci`, K6 (`grafana/setup-k6-action`), **`npm run test:perf:smoke:ci`** — smoke fixo (10 VUs, 30 s) com **`--out json=test-output/k6/k6-results.json`** e **`--summary-export=test-output/k6/k6-summary.json`**. O artifact **`k6-report`** inclui `k6-output.txt` (stdout) e `test-output/k6/`. O job **falha** se o K6 sair com codigo != 0 (threshold ou erro). **Validação:** na execução em Actions, verifica o step verde/vermelho; baixa **k6-report** e confere `k6-summary.json` / `k6-results.json`. O cenario completo (500 VUs, ~7 min) continua tipicamente local via `npm run test:perf`.

### Stages (perfil de carga)

| Fase | Duracao | Usuarios alvo |
|------|---------|---------------|
| Ramp-up | 1 min | 0 -> 500 VUs |
| Carga sustentada | 5 min | 500 VUs |
| Ramp-down | 1 min | 500 -> 0 VUs |

**Duracao total:** ~7 minutos.

### Endpoints exercitados

Os paths sao relativos a `K6_BASE_URL` (padrao `https://test.k6.io`).

| Metodo | Path | Proposito |
|--------|------|-----------|
| GET | `/` | Pagina inicial |
| GET | `/contacts.php` | Simula leitura de recurso (lista) |

Entre cada request ha pausa configuravel (`K6_SLEEP_S`, padrao 1 s).

### Thresholds (SLA do teste)

| Metrica | Regra | Significado |
|---------|-------|-------------|
| `http_req_duration` | `p(95) < 2000` ms | 95% das requisicoes devem responder em ate 2 segundos |
| `http_req_failed` | `rate < 0.1` | Menos de 10% de falhas HTTP |
| `errors` (custom) | `rate < 0.1` | Menos de 10% de falhas nos `check()` |

Se um threshold for violado, o K6 encerra com codigo de saida diferente de zero (util para CI).

### Metricas customizadas

- `errors` (`Rate`): taxa de falhas nos checks de negocio (status esperado).
- `request_duration` (`Trend`): duracao por request para analise adicional (espelha tendencia de latencia).

---

## Como Executar

### Teste completo (requisito do desafio)

Requer K6 instalado: https://k6.io/docs/get-started/installation/

```bash
npm run test:perf
```

Ou diretamente:

```bash
k6 run performance/load-test.js
```

### Smoke test rapido (validacao local)

```bash
npm run test:perf:smoke
```

Equivale a aproximadamente 10 VUs por 30 segundos (nao substitui o cenario de 500 VUs / 5 min).

**Mesmo comando que o CI** (gera JSON + summary em `test-output/k6/`):

```bash
npm run test:perf:smoke:ci
```

Os ficheiros ficam em `test-output/k6/` (pasta ignorada pelo Git com o resto de `test-output/`).

### Exportar JSON para analise externa

```bash
k6 run --out json=performance/k6-results.json performance/load-test.js
```

O arquivo `performance/k6-results.json` esta ignorado pelo Git (ver `.gitignore`).

---

## Resultado de Execucao de Referencia

Execucao local realizada em **29/03/2026** com o script e stages atuais (500 VUs, 7 min totais).

| Metrica | Valor |
|---------|-------|
| Total de requests HTTP | 299.716 |
| Taxa de falha HTTP | 0,00% |
| Latencia media | 101,72 ms |
| Latencia minima | 8,04 ms |
| Latencia maxima | 1.670,00 ms |
| P90 | 178,51 ms |
| P95 | 196,10 ms |
| VUs maximos | 500 |
| Iteracoes completas | 74.929 |

Todos os **thresholds** definidos no script foram **atendidos** nesta execucao (exit code 0).

---

## Analise e Gargalos

### Comportamento geral

- A API **test.k6.io** manteve **taxa de erro zero** durante o teste, o que indica estabilidade sob o perfil aplicado.
- A **media (~102 ms)** e o **P95 (~196 ms)** ficaram muito abaixo do limite de 2 s, com folga para crescimento de carga ou redes mais lentas.

### Onde observar possivel gargalo

1. **Pico de latencia (maximo ~1,67 s)**  
   - Distancia grande entre **P95 (~196 ms)** e **maximo (~1,67 s)** sugere **cauda longa**: poucas requisicoes demoraram muito mais que a maioria.  
   - Possiveis causas: congestionamento momentaneo na rede, fila no servidor, cold start ou picos simultaneos de VUs.

2. **Ramp-up de 1 minuto ate 500 VUs**  
   - E o trecho em que a carga sobe mais rapido; e natural ver mais variacao de latencia nessa fase. Vale comparar execucoes repetidas para ver se o pico e recorrente.

3. **Dois GET por iteracao + sleep(1)**  
   - O throughput efetivo e limitado pelo `sleep`, o que e intencional (comportamento mais proximo de usuario real). Para stress puro da API, poder-se-ia reduzir ou remover o sleep em outro cenario.

### Conclusao para entrevista / entrega

- O script demonstra **perfil de carga claro**, **metricas padrao e customizadas**, e **criterios objetivos (thresholds)**.  
- A **analise** combina numeros agregados (media, percentis) com interpretacao do **maximo** e da **dispersao** (identificacao de cauda longa como “gargalo pontual” em vez de falha sistematica).

---

## Relacao com Outros Testes do Projeto

| Tipo | Ferramenta | Alvo | Pasta / arquivo |
|------|------------|------|-----------------|
| API funcional | Playwright | Restful-Booker | `tests/api/booking.spec.ts` |
| E2E | Cucumber + Playwright | Automation Exercise | `e2e/features/`, `e2e/steps/` |
| Carga | K6 | test.k6.io | `performance/load-test.js` |

Nao ha conflito: o K6 nao altera configuracao nem execucao dos testes de API Playwright.

---

## Referencias

- Documentacao K6: https://k6.io/docs/
- test.k6.io (site de demonstracao): https://test.k6.io/

---

*Documento alinhado ao modelo de `docs/API_TESTS.md` e `docs/E2E_TESTS.md`. Ultima atualizacao: Marco 2026.*
