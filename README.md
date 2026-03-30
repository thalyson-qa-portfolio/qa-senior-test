# QA Senior Test

Projeto de automação de testes desenvolvido como avaliação técnica para vaga de **QA Sênior**. O projeto cobre testes de API, testes E2E com BDD, integração CI/CD e testes de performance.

---

## Tecnologias e Versões

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 18+ | Runtime |
| TypeScript | 6.0.2 | Linguagem |
| Playwright | 1.58.2 | Testes de API e automação de browser |
| Cucumber | 11.3.0 | Framework BDD (Gherkin) |
| ts-node | 10.9.2 | Execução de TypeScript |
| K6 | 1.4+ (instalação separada) | Testes de carga / performance |

---

## Estrutura do Projeto

O repositório agrupa **três suítes** com pastas claras:

| Suíte | Pasta principal | Ferramenta |
|-------|-----------------|-------------|
| API | `tests/api/` | Playwright Test |
| E2E | `e2e/` | Cucumber + Playwright |
| Performance | `performance/` | K6 |

Configurações compartilhadas entre API (Playwright) e E2E ficam em `e2e/support/config.ts` (URLs `API_BASE_URL` e `E2E_BASE_URL`).

```
qa-senior-test/
├── tests/
│   └── api/
│       └── booking.spec.ts      # Testes de API (Restful-Booker)
├── e2e/                         # Suite E2E (Cucumber + Playwright)
│   ├── features/
│   │   ├── login.feature
│   │   ├── checkout.feature
│   │   └── navegacao.feature
│   ├── steps/
│   │   ├── login.steps.ts
│   │   ├── checkout.steps.ts
│   │   └── navegacao.steps.ts
│   ├── pages/
│   │   ├── LoginPage.ts
│   │   ├── CheckoutPage.ts
│   │   └── ProductsPage.ts
│   └── support/
│       ├── config.ts            # URLs (API + E2E)
│       └── hooks.ts             # Hooks Cucumber (Before/After)
├── docs/
│   ├── API_TESTS.md             # Documentação dos testes de API
│   ├── E2E_TESTS.md             # Documentação dos testes E2E
│   └── PERFORMANCE_TESTS.md     # Documentação dos testes de carga (K6)
├── performance/
│   └── load-test.js             # Script K6 (500 VUs, 5 min de carga)
├── test-output/                 # Saidas geradas (gitignored)
│   ├── playwright-report/     # Relatorio HTML API (Playwright)
│   ├── test-results/          # Artefatos de falha API (Playwright)
│   ├── reports/               # Relatorio HTML E2E (Cucumber) + JSON
│   ├── cucumber-html-report/  # Dashboard HTML (pizza, features) apos test:e2e
│   ├── screenshots/           # Falhas E2E
│   ├── traces/                # Trace Viewer E2E
│   └── videos/                # VIDEO=true
├── playwright.config.ts         # Configuração do Playwright
├── cucumber.js                  # Configuração do Cucumber
└── tsconfig.json                # Configuração do TypeScript
```

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** (incluso com Node.js)
- **K6** 1.x (apenas para `npm run test:perf`; ver secao Instalacao, passo 4)

Verificar versão instalada:
```bash
node --version  # v18.x.x ou superior
npm --version
```

---

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd qa-senior-test
```

2. Instale as dependências:
```bash
npm install
```

3. Instale os browsers do Playwright:
```bash
npx playwright install chromium
```

4. (Opcional) Para testes de carga, instale o [K6](https://k6.io/docs/get-started/installation/):
```bash
brew install k6   # macOS
k6 version
```

---

## Extensões Recomendadas (VSCode/Cursor)

Para melhor experiência de desenvolvimento, instale as extensões recomendadas:

| Extensão | ID | Benefício |
|----------|-----|-----------|
| Cucumber (Gherkin) Full Support | `alexkrechik.cucumberautocomplete` | Syntax highlighting, Ctrl+Click para ir ao step |
| Playwright Test for VSCode | `ms-playwright.playwright` | Executar testes, debug, trace viewer |

**Instalação rápida:**

Ao abrir o projeto, o VSCode/Cursor sugere automaticamente as extensões (arquivo `.vscode/extensions.json`).

Ou instale manualmente:
```bash
code --install-extension alexkrechik.cucumberautocomplete
code --install-extension ms-playwright.playwright
```

**Funcionalidades após instalação:**
- Cores nos arquivos `.feature`
- **Ctrl+Click** em um step vai direto para a implementação
- Autocomplete de steps existentes
- Validação de steps não implementados

---

## Executar Testes

### Testes de API

```bash
npm run test:api
```

Executa testes automatizados contra a API [Restful-Booker](https://restful-booker.herokuapp.com/).

**Cobertura:**
- GET, POST, PUT, DELETE
- Validação de status codes, headers e body
- Cenários positivos e negativos
- Autenticação

### Testes E2E

```bash
npm run test:e2e
```

Executa testes E2E com Cucumber no site [Automation Exercise](https://automationexercise.com/).

**Cobertura:**
- Login (positivo e negativo)
- Navegação entre páginas
- Checkout completo
- Validação de campos obrigatórios

### Testes de performance (K6)

```bash
npm run test:perf
```

Executa carga com **500 usuarios virtuais** (ramp-up 1 min, **5 min** em plataforma, ramp-down 1 min) contra **https://test.k6.io** (API publica recomendada para testes de carga).

Smoke rapido (validacao local, ~30 s):

```bash
npm run test:perf:smoke
```

**Documentacao:** [docs/PERFORMANCE_TESTS.md](docs/PERFORMANCE_TESTS.md)

### Todos os Testes

```bash
npm test
```

Executa testes de API e E2E sequencialmente (nao inclui K6).

---

## Opções de Execução (E2E)

### Ver browser executando

```bash
HEADLESS=false npm run test:e2e
```

### Modo debug (câmera lenta)

```bash
HEADLESS=false SLOWMO=500 npm run test:e2e
```

### Gravar vídeo

```bash
VIDEO=true npm run test:e2e
```

---

## Relatórios

### Relatório de API (Playwright)

Após executar `npm run test:api`:

```bash
npx playwright show-report test-output/playwright-report
```

O relatório HTML é gerado em `test-output/playwright-report/`.

### Relatório E2E (Cucumber + dashboard)

Após executar `npm run test:e2e` (o comando já gera o dashboard ao final):

- **Cucumber HTML (oficial):** `test-output/reports/cucumber-report.html`
- **JSON:** `test-output/reports/cucumber-results.json`
- **Dashboard** (pizzas, metadados, cards por feature — `multiple-cucumber-html-reporter`): `test-output/cucumber-html-report/index.html`

```bash
open test-output/cucumber-html-report/index.html
```

Para regerar só o dashboard a partir do JSON existente: `npm run report:e2e`. Para rodar o Cucumber sem pós-processamento: `npm run test:e2e:cucumber`.

### Trace Viewer (Debugging E2E)

Para análise detalhada de cenários E2E:

```bash
npx playwright show-trace test-output/traces/<nome-do-cenario>.zip
```

### Relatorio de carga (K6)

O K6 imprime um resumo no terminal ao final de `npm run test:perf`. Para exportar JSON:

```bash
k6 run --out json=performance/k6-results.json performance/load-test.js
```

Detalhes e analise de uma execucao de referencia: [docs/PERFORMANCE_TESTS.md](docs/PERFORMANCE_TESTS.md).

---

## CI/CD (GitHub Actions)

O projeto inclui pipeline de integracao continua que executa automaticamente:

### Triggers

- **Push**: Qualquer branch
- **Pull Request**: Branch main

### Jobs

| Job | Descricao | Duracao |
|-----|-----------|---------|
| `api-tests` | Executa testes de API | ~1 min |
| `e2e-tests` | Executa testes E2E com Chromium | ~2-3 min |
| `performance-tests` | K6 smoke (`npm run test:perf:smoke`, 10 VUs / 30s) | ~1 min |

A carga completa (500 VUs, varios minutos) continua apenas localmente via `npm run test:perf`; o CI valida o script e o alvo com execucao leve.

### Artifacts (Relatorios)

Apos cada execucao, os relatorios ficam disponiveis na aba **Actions** do GitHub:

| Artifact | Conteudo |
|----------|----------|
| `api-report` | `test-output/playwright-report/` |
| `e2e-report` | Dashboard E2E (`cucumber-html-report/` — abrir `index.html`) |
| `e2e-failure-evidence` | Só se algum cenario falhar: traces (`.zip`), screenshots, videos |

**Como acessar:**
1. Va para a aba "Actions" no GitHub
2. Clique na execucao desejada
3. Role ate "Artifacts"
4. Baixe o zip do relatorio

---

## Cenários de Teste

### API (11 testes)

Com a Restful-Booker pública, o cenário de credenciais inválidas **falha de propósito**: o teste exige **401**, mas a API responde **200** com `Bad credentials` (comportamento documentado; ver [docs/API_TESTS.md](docs/API_TESTS.md)).

| Tipo | Cenário | Status |
|------|---------|--------|
| Positivo | GET /booking - Lista reservas | Passa |
| Positivo | POST /auth - Gera token | Passa |
| Positivo | POST /booking - Cria reserva | Passa |
| Positivo | GET /booking/{id} - Busca específica | Passa |
| Positivo | PUT /booking/{id} - Atualiza reserva | Passa |
| Positivo | DELETE /booking/{id} - Remove reserva | Passa |
| Negativo | POST /auth - Credenciais inválidas | Falha (esperado 401; API retorna 200) |
| Negativo | PUT sem token | Passa |
| Negativo | POST sem campos obrigatórios | Passa |
| Negativo | GET ID inexistente | Passa |
| Negativo | DELETE sem ID | Passa |

**Resumo:** 10 passando, 1 falhando (bug conhecido da API).

### E2E (10 cenários)

| Feature | Cenário | Tipo |
|---------|---------|------|
| Login | Credenciais válidas | Positivo |
| Login | Credenciais inválidas | Negativo |
| Login | Campos vazios | Negativo |
| Login | Cadastro sem endereço | Negativo |
| Checkout | Completo com sucesso | Positivo |
| Checkout | Campos de pagamento vazios | Negativo |
| Checkout | Cartão inválido | Negativo |
| Navegação | Página de produtos | Positivo |
| Navegação | Categoria de produtos | Positivo |
| Navegação | Buscar produto | Positivo |

---

## Documentação Detalhada

Para explicações técnicas completas, consulte:

- [Guia do avaliador — como as atividades foram resolvidas](CONTEXTO_PROJETO.md)
- [Documentação de Testes de API](docs/API_TESTS.md)
- [Documentação de Testes E2E](docs/E2E_TESTS.md)
- [Documentação de Testes de Performance (K6)](docs/PERFORMANCE_TESTS.md)

---

## Boas Práticas Aplicadas

- **Page Object Pattern** - Locators centralizados
- **BDD com Gherkin** - Cenários em linguagem natural
- **API para setup** - Criação de dados via API (mais rápido)
- **Testes independentes** - Cada cenário cria seus próprios dados
- **Configuração centralizada** - URLs em arquivo de config
- **Traces e screenshots** - Debugging facilitado

---

## Aplicações de Teste

| Tipo | Site | URL |
|------|------|-----|
| API | Restful-Booker | https://restful-booker.herokuapp.com |
| E2E | Automation Exercise | https://automationexercise.com |

---

## Autor

Desenvolvido como parte do processo seletivo para QA Sênior.

---

*Última atualização: Março 2026*
