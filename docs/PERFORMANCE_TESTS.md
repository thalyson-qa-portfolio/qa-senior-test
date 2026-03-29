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

**Integracao CI:** o workflow em `.github/workflows/tests.yml` inclui o job `performance-tests`, que roda `npm run test:perf:smoke` (10 VUs, 30 s) em todo push/PR. O cenario completo (500 VUs, ~7 min) continua apenas localmente via `npm run test:perf`.

### Stages (perfil de carga)

| Fase | Duracao | Usuarios alvo |
|------|---------|---------------|
| Ramp-up | 1 min | 0 -> 500 VUs |
| Carga sustentada | 5 min | 500 VUs |
| Ramp-down | 1 min | 500 -> 0 VUs |

**Duracao total:** ~7 minutos.

### Endpoints exercitados

| Metodo | URL | Proposito |
|--------|-----|-----------|
| GET | `https://test.k6.io/` | Pagina inicial |
| GET | `https://test.k6.io/contacts.php` | Simula leitura de recurso (lista) |

Entre cada request ha `sleep(1)` para simular tempo de pensamento do usuario.

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
