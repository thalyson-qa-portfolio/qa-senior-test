# Documentação: testes de carga com K6

## Visão geral

Este documento descreve os testes de performance (carga) do projeto, implementados com **K6** para atender à **Atividade 4** do teste técnico (opcional): simular carga em API pública com métricas e análise de resultados.

**Importante:** os testes de API funcionais continuam na **Restful-Booker** (`tests/api/`). O script de carga usa a API pública **test.k6.io**, mantida pelo time do K6 para testes de performance, evitando rate limiting e respostas inconsistentes sob carga pesada.

---

## Requisitos do exercício

### Tarefa 1

- Teste de carga básico em API pública (pode ser mock ou API dedicada a testes)
- **500 usuários simultâneos por 5 minutos** (mantidos após ramp-up)

### Tarefa 2

- Relatório de teste de carga e análise do resultado

### Critérios de avaliação

| Critério | Como foi atendido |
|----------|-------------------|
| Qualidade do script | Script em `performance/load-test.js`: stages, checks, thresholds, métricas customizadas, summary em texto |
| Uso correto de métricas | `http_req_duration`, `http_req_failed`, `http_reqs`, `vus`, `iterations`, `Rate`, `Trend` |
| Identificação de gargalos | Seção **Análise** abaixo + comparação média vs P95 vs máximo |

---

## Arquivo e configuração

| Arquivo | Descrição |
|---------|-----------|
| `performance/load-test.js` | Script K6 principal |

### Variáveis de ambiente (`__ENV`)

O script lê os parâmetros via **`__ENV`** (passar com `k6 run -e CHAVE=valor` ou `export` antes do comando). Valores padrão mantêm o cenário original (500 VUs, ~7 min, test.k6.io).

| Variável | Default | Descrição |
|----------|---------|-----------|
| `K6_BASE_URL` | `https://test.k6.io` | Origem HTTP (sem barra final) |
| `K6_RAMP_DURATION` | `1m` | Duração ramp-up |
| `K6_LOAD_DURATION` | `5m` | Platô de carga |
| `K6_RAMP_DOWN_DURATION` | `1m` | Ramp-down |
| `K6_TARGET_VUS` | `500` | VUs alvo no platô |
| `K6_VUS` | (usa `K6_TARGET_VUS`) | Alias opcional de VUs (se `K6_TARGET_VUS` estiver vazio, vale este) |
| `K6_SLEEP_S` | `1` | Pausa em segundos entre passos dentro de cada iteração |
| `K6_P95_MS` | `2000` | Limite do threshold `http_req_duration` (p95) |
| `K6_HTTP_FAIL_RATE_MAX` | `0.1` | Limite máx. da taxa de falha HTTP |
| `K6_ERRORS_RATE_MAX` | `0.1` | Limite máx. da taxa da métrica customizada `errors` |

Exemplo (só altera URL, mantém o resto):

```bash
k6 run -e K6_BASE_URL=https://test.k6.io performance/load-test.js
```

### GitHub Actions (variáveis do repositório)

No repositório: **Settings → Secrets and variables → Actions → Variables**. Use **o mesmo nome** das variáveis `K6_*` da tabela. O job `performance-tests` em [`.github/workflows/tests.yml`](../.github/workflows/tests.yml) passa `vars.K6_*` para o processo do K6 (valores vazios usam os defaults do workflow ou do script, conforme a linha). O comando `npm run test:perf:smoke:ci` **não** usa `--vus`/`--duration`: o perfil vem dos **`stages`** em `load-test.js`, alimentados por essas variáveis.

**Defaults no CI (quando uma variável não existe):** o workflow preenche `K6_RAMP_DURATION=5s`, `K6_LOAD_DURATION=20s`, `K6_RAMP_DOWN_DURATION=5s` e `K6_TARGET_VUS=10` (smoke curto, ~30 s no total). Para o cenário do desafio (500 VUs, ~7 min), defina no GitHub as variáveis com os valores da tabela (ex.: `1m` / `5m` / `1m`, `500`) ou execute localmente `npm run test:perf` sem variáveis.

**Integração CI:** **Node 20**, `npm ci`, K6 (`grafana/setup-k6-action`), **`npm run test:perf:smoke:ci`** com **`--out json=test-output/k6/k6-results.json`** e **`--summary-export=test-output/k6/k6-summary.json`**. O artifact **`k6-report`** inclui `k6-output.txt` (stdout) e `test-output/k6/`. O job **falha** se o K6 sair com código ≠ 0. **Validação:** na execução em Actions, verifique o step verde/vermelho; baixe **k6-report** e confira `k6-summary.json` / `k6-results.json`.

### Stages (perfil de carga)

| Fase | Duração | Usuários alvo |
|------|---------|---------------|
| Ramp-up | 1 min | 0 -> 500 VUs |
| Carga sustentada | 5 min | 500 VUs |
| Ramp-down | 1 min | 500 -> 0 VUs |

**Duração total:** ~7 minutos.

### Endpoints exercitados

Os paths são relativos a `K6_BASE_URL` (padrão `https://test.k6.io`).

| Método | Path | Propósito |
|--------|------|-----------|
| GET | `/` | Página inicial |
| GET | `/contacts.php` | Simula leitura de recurso (lista) |

Entre cada request há pausa configurável (`K6_SLEEP_S`, padrão 1 s).

### Thresholds (SLA do teste)

| Métrica | Regra | Significado |
|---------|-------|-------------|
| `http_req_duration` | `p(95) < 2000` ms | 95% das requisições devem responder em até 2 segundos |
| `http_req_failed` | `rate < 0.1` | Menos de 10% de falhas HTTP |
| `errors` (custom) | `rate < 0.1` | Menos de 10% de falhas nos `check()` |

Se um threshold for violado, o K6 encerra com código de saída diferente de zero (útil para CI).

### Métricas customizadas

- `errors` (`Rate`): taxa de falhas nos checks de negócio (status esperado).
- `request_duration` (`Trend`): duração por request para análise adicional (espelha tendência de latência).

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

### Smoke test rápido (validação local)

```bash
npm run test:perf:smoke
```

Usa os **defaults do script** (500 VUs, ~7 min) salvo `export`/`k6 run -e` com outros `K6_*`. Para smoke curto local, passa por exemplo `-e K6_TARGET_VUS=10` e durações curtas.

**Mesmo comando que o CI** (gera JSON + summary em `test-output/k6/`):

```bash
npm run test:perf:smoke:ci
```

Os arquivos ficam em `test-output/k6/` (pasta ignorada pelo Git com o resto de `test-output/`).

### Exportar JSON para analise externa

```bash
k6 run --out json=performance/k6-results.json performance/load-test.js
```

O arquivo `performance/k6-results.json` está ignorado pelo Git (ver `.gitignore`).

---

## Resultado de execução de referência

Execução local realizada em **29/03/2026** com o script e stages atuais (500 VUs, 7 min totais).

| Métrica | Valor |
|---------|-------|
| Total de requests HTTP | 299.716 |
| Taxa de falha HTTP | 0,00% |
| Latência média | 101,72 ms |
| Latência mínima | 8,04 ms |
| Latência máxima | 1.670,00 ms |
| P90 | 178,51 ms |
| P95 | 196,10 ms |
| VUs máximos | 500 |
| Iterações completas | 74.929 |

Todos os **thresholds** definidos no script foram **atendidos** nesta execução (exit code 0).

---

## Análise e gargalos

### Comportamento geral

- A API **test.k6.io** manteve **taxa de erro zero** durante o teste, o que indica estabilidade sob o perfil aplicado.
- A **média (~102 ms)** e o **P95 (~196 ms)** ficaram muito abaixo do limite de 2 s, com folga para crescimento de carga ou redes mais lentas.

### Onde observar possível gargalo

1. **Pico de latência (máximo ~1,67 s)**  
   - Distância grande entre **P95 (~196 ms)** e **máximo (~1,67 s)** sugere **cauda longa**: poucas requisições demoraram muito mais que a maioria.  
   - Possíveis causas: congestionamento momentâneo na rede, fila no servidor, cold start ou picos simultâneos de VUs.

2. **Ramp-up de 1 minuto até 500 VUs**  
   - É o trecho em que a carga sobe mais rápido; é natural ver mais variação de latência nessa fase. Vale comparar execuções repetidas para ver se o pico é recorrente.

3. **Dois GET por iteração + sleep(1)**  
   - O throughput efetivo é limitado pelo `sleep`, o que é intencional (comportamento mais próximo de usuário real). Para stress puro da API, poder-se-ia reduzir ou remover o sleep em outro cenário.

### Conclusão para entrevista / entrega

- O script demonstra **perfil de carga claro**, **métricas padrão e customizadas**, e **critérios objetivos (thresholds)**.  
- A **análise** combina números agregados (média, percentis) com interpretação do **máximo** e da **dispersão** (identificação de cauda longa como “gargalo pontual” em vez de falha sistemática).

---

## Relação com outros testes do projeto

| Tipo | Ferramenta | Alvo | Pasta / arquivo |
|------|------------|------|-----------------|
| API funcional | Playwright | Restful-Booker | `tests/api/booking.spec.ts` |
| E2E | Cucumber + Playwright | Automation Exercise | `e2e/features/`, `e2e/steps/` |
| Carga | K6 | test.k6.io | `performance/load-test.js` |

Não há conflito: o K6 não altera configuração nem execução dos testes de API Playwright.

---

## Referências

- Documentação K6: https://k6.io/docs/
- test.k6.io (site de demonstração): https://test.k6.io/

---

*Documento alinhado ao modelo de `docs/API_TESTS.md` e `docs/E2E_TESTS.md`. Última atualização: março 2026.*
