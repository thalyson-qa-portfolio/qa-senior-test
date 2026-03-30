# Guia do avaliador — como as atividades do desafio foram resolvidas

Este documento **não substitui** o [README.md](README.md) nem a pasta [docs/](docs/); serve para o avaliador **localizar rapidamente** o que foi pedido no teste técnico, **onde está implementado** e **quais decisões** foram tomadas.

---

## Visão geral da entrega

| Área | Ferramenta | Onde está | Comando local |
|------|------------|-----------|---------------|
| API | Playwright Test | [tests/api/booking.spec.ts](tests/api/booking.spec.ts) | `npm run test:api` |
| E2E | Cucumber + Playwright | [e2e/](e2e/) | `npm run test:e2e` |
| CI/CD | GitHub Actions | [.github/workflows/tests.yml](.github/workflows/tests.yml) | (automático no push/PR) |
| Performance | K6 | [performance/load-test.js](performance/load-test.js) | `npm run test:perf` (carga completa) / `npm run test:perf:smoke` (smoke) |

Documentação técnica detalhada: [docs/API_TESTS.md](docs/API_TESTS.md), [docs/E2E_TESTS.md](docs/E2E_TESTS.md), [docs/PERFORMANCE_TESTS.md](docs/PERFORMANCE_TESTS.md).

---

## 1. Testes de API

### O que o desafio pedia (em síntese)
Validação de status, corpo e fluxos REST (incluindo negativos), métodos GET/POST/PUT/DELETE, autenticação, relatório.

### Como foi resolvido
- **Arquivo único da suíte:** [tests/api/booking.spec.ts](tests/api/booking.spec.ts) — cenários agrupados por `test.describe` (fluxo feliz, negativos de payload, negativos de autenticação/autorização).
- **Base URL:** definida em [e2e/support/config.ts](e2e/support/config.ts) como `API_BASE_URL` e referenciada no [playwright.config.ts](playwright.config.ts) (`baseURL`).
- **Relatório HTML:** gerado em `test-output/playwright-report/` (configuração do reporter em `playwright.config.ts`). **JSON:** `test-output/playwright-report/results.json` — usado pelo Job Summary da CI (métricas e tabela de falhas). Artefatos de falha da API em `test-output/test-results/` (`outputDir`).
- **Credenciais inválidas em `POST /auth`:** a Restful-Booker responde **HTTP 200** com `{"reason":"Bad credentials"}` em vez de **401** (RFC). O teste **exige status 401**; com a API pública atual a suíte fica em **10 passando e 1 falhando**, documentando o bug. Ver [docs/API_TESTS.md](docs/API_TESTS.md).

### Onde aprofundar
[docs/API_TESTS.md](docs/API_TESTS.md) — estrutura dos testes, como abrir o relatório, convenções.

---

## 2. Testes E2E (Cucumber + Page Objects)

### O que o desafio pedia (em síntese)
Login (positivo/negativo), navegação, checkout (incluindo negativos), BDD com Gherkin, Page Object, relatório com evidências.

### Como foi resolvido
- **Features:** [e2e/features/](e2e/features/) — `login.feature`, `checkout.feature`, `navegacao.feature`.
- **Step definitions:** [e2e/steps/](e2e/steps/) — amarram Gherkin ao Playwright.
- **Page Objects:** [e2e/pages/](e2e/pages/) — `LoginPage`, `CheckoutPage`, `ProductsPage` (locators e ações encapsulados).
- **Hooks e browser:** [e2e/support/hooks.ts](e2e/support/hooks.ts) — browser Chromium, trace em falha, screenshots; pastas sob `test-output/` (screenshots, traces, videos, relatório Cucumber).
- **Configuração Cucumber:** [cucumber.js](cucumber.js) — `paths` e `require` apontando para `e2e/`.
- **Ajuste de estabilidade:** subcategorias na página de produtos podem ter mais de um link com o mesmo texto no DOM; o clique usa o **primeiro link visível** (ver `ProductsPage.clickSubcategory`) para evitar falha intermitente.

### Evidências e relatório
- HTML Cucumber: `test-output/reports/cucumber-report.html`
- JSON Cucumber (formatter): `test-output/reports/cucumber-results.json` — usado pelo Job Summary E2E (métricas e tabela de falhas).
- Traces / screenshots / vídeos: `test-output/traces`, `test-output/screenshots`, `test-output/videos` (conforme hooks e `VIDEO=true`).

### Onde aprofundar
[docs/E2E_TESTS.md](docs/E2E_TESTS.md).

---

## 3. CI/CD (GitHub Actions)

### O que o desafio pedia (em síntese)
Pipeline que execute testes após commits, com visibilidade dos resultados.

### Como foi resolvido
- **Workflow:** [.github/workflows/tests.yml](.github/workflows/tests.yml).
- **Triggers:** push em qualquer branch; pull request para `main`.
- **Três jobs em paralelo:**
  1. **api-tests** — `npm ci`, `npm run test:api`, upload do artifact **api-report** (`test-output/playwright-report/`).
  2. **e2e-tests** — `npm ci`, Playwright Chromium, `npm run test:e2e`, artifact **e2e-report** (só `test-output/reports/`: HTML + JSON Cucumber). Se a suíte falhar, artifact adicional **e2e-failure-evidence** (traces, screenshots, videos).
  3. **performance-tests** — instalação do K6 (`grafana/setup-k6-action`), `npm run test:perf:smoke` (10 VUs, 30 s) para validar o script em CI sem o custo da carga completa.
- **Job Summary (painel da execução):** [.github/scripts/render-job-summary.sh](.github/scripts/render-job-summary.sh) escreve Markdown em `GITHUB_STEP_SUMMARY` (variável injetada pelo runner). O workflow grava o **exit code real** do comando de teste em `.job-exit-code`; o script usa isso para o badge (**Run: success** / falhou) e monta o conteúdo por tipo de suíte (`api`, `e2e`, `k6`).
  - **Métricas (API e E2E):** seção `### Metricas` com a **mesma** tabela: **Pass rate (%)** na primeira coluna, depois **Total**, **Passaram**, **Falharam**, **Duração** (na API, duração em ms a partir do `results.json` do Playwright; no E2E, texto de duração extraído do log do Cucumber quando existir, senão `n/d`).
  - **API:** lê `test-output/playwright-report/results.json` — após as métricas, tabela **Por grupo e teste**; seção **Falhas (cenario, esperado e encontrado)** para testes com falha (`ok: false`), com **esperado** e **encontrado** extraídos da mensagem de erro (ex.: `Expected: 401` / `Received: 200`). Bloco expansível com final do log da suíte.
  - **E2E:** lê `test-output/reports/cucumber-results.json` — tabela por feature/cenário; **Falhas (cenario, step e log)** para steps com `result.status == "failed"` (feature, cenário, texto do step, `error_message`). Bloco expansível com final do log.
  - **K6 (smoke):** trecho de métricas a partir da linha que contém `RESULTADO DO TESTE` no log; `<details>` com **log completo** da execução.
- Os steps de teste usam `continue-on-error: true` para **ainda assim** publicar artifacts e Job Summary quando houver falha.
- **Artifacts:** baixáveis na aba **Actions** da execução (instruções no README, seção CI/CD).

---

## 4. Testes de performance (K6)

### O que o desafio pedia (em síntese)
Carga elevada (ex.: 500 usuários sustentados), métricas, análise e relatório.

### Como foi resolvido
- **Script:** [performance/load-test.js](performance/load-test.js) — `stages` com ramp-up, **5 minutos** em 500 VUs e ramp-down; checks e thresholds; métricas customizadas (`Rate`, `Trend`); bloco textual de resumo ao final da execução.
- **Alvo:** **https://test.k6.io** — API/site mantidos pelo projeto K6 para testes de carga, evitando sobrecarregar a Restful-Booker e reduzindo flakiness sob muitos VUs.
- **Relatório / análise:** descritos em [docs/PERFORMANCE_TESTS.md](docs/PERFORMANCE_TESTS.md) (inclui exemplo de export JSON e leitura de métricas).
- **CI vs local:** no GitHub roda apenas o **smoke** (`test:perf:smoke`); a prova do requisito de **500 VUs × 5 min** fica documentada no script e na doc, executável localmente com `npm run test:perf`.

---

## 5. Decisões de estrutura e configuração

| Decisão | Motivo |
|---------|--------|
| Suíte E2E sob `e2e/` | Separação clara de features, steps, pages e support; `cucumber.js` centralizado na raiz. |
| URLs em `e2e/support/config.ts` | Um arquivo para `API_BASE_URL` e `E2E_BASE_URL`; Playwright de API importa o mesmo módulo. |
| Saídas em `test-output/` (gitignored) | Relatórios e evidências não versionados; caminhos alinhados entre Playwright, Cucumber e hooks. |
| `.env.example` | Documenta variáveis usadas pelos hooks E2E (`HEADLESS`, `SLOWMO`, `VIDEO`); o projeto **não** carrega `.env` automaticamente (ver comentários no arquivo). |

---

## 6. Como reproduzir localmente (checklist rápido)

```bash
npm install
npx playwright install chromium   # necessário para E2E
npm run test:api
npm run test:e2e
# opcional: K6 instalado
npm run test:perf:smoke           # rápido
npm run test:perf                 # carga completa (~7 min)
```

---

## 7. Status das fases internas do projeto

Todas as frentes planejadas (setup, API, E2E, CI, performance, documentação principal) foram concluídas para fins deste desafio. Ajustes finos de portfólio continuam no README e nos `docs/` conforme necessário.

---

*Documento voltado ao avaliador — Março 2026*
