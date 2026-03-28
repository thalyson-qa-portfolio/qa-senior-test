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

---

## Estrutura do Projeto

```
qa-senior-test/
├── tests/
│   └── api/
│       └── booking.spec.ts      # Testes de API (Restful-Booker)
├── features/
│   ├── login.feature            # Cenários de login e cadastro
│   ├── checkout.feature         # Cenários de checkout
│   └── navegacao.feature        # Cenários de navegação
├── steps/
│   ├── login.steps.ts           # Step definitions de login
│   ├── checkout.steps.ts        # Step definitions de checkout
│   └── navegacao.steps.ts       # Step definitions de navegação
├── pages/
│   ├── LoginPage.ts             # Page Object de Login
│   ├── CheckoutPage.ts          # Page Object de Checkout
│   └── ProductsPage.ts          # Page Object de Produtos
├── support/
│   ├── config.ts                # Configurações (URL base)
│   └── hooks.ts                 # Hooks do Cucumber (Before/After)
├── docs/
│   ├── API_TESTS.md             # Documentação dos testes de API
│   └── E2E_TESTS.md             # Documentação dos testes E2E
├── playwright-report/           # Relatório HTML dos testes de API
├── reports/                     # Relatório HTML dos testes E2E
├── traces/                      # Traces do Playwright (debugging)
├── playwright.config.ts         # Configuração do Playwright
├── cucumber.js                  # Configuração do Cucumber
└── tsconfig.json                # Configuração do TypeScript
```

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** (incluso com Node.js)

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

### Todos os Testes

```bash
npm test
```

Executa testes de API e E2E sequencialmente.

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
npx playwright show-report
```

O relatório HTML é gerado em `playwright-report/`.

### Relatório E2E (Cucumber)

Após executar `npm run test:e2e`:

O relatório HTML é gerado em `reports/cucumber-report.html`.

### Trace Viewer (Debugging E2E)

Para análise detalhada de cenários E2E:

```bash
npx playwright show-trace traces/<nome-do-cenario>.zip
```

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

### Artifacts (Relatorios)

Apos cada execucao, os relatorios ficam disponiveis na aba **Actions** do GitHub:

| Artifact | Conteudo |
|----------|----------|
| `api-report` | Relatorio HTML do Playwright |
| `e2e-report` | Relatorio Cucumber + Traces |

**Como acessar:**
1. Va para a aba "Actions" no GitHub
2. Clique na execucao desejada
3. Role ate "Artifacts"
4. Baixe o zip do relatorio

---

## Cenários de Teste

### API (11 testes)

| Tipo | Cenário | Status |
|------|---------|--------|
| Positivo | GET /booking - Lista reservas | Passa |
| Positivo | POST /auth - Gera token | Passa |
| Positivo | POST /booking - Cria reserva | Passa |
| Positivo | GET /booking/{id} - Busca específica | Passa |
| Positivo | PUT /booking/{id} - Atualiza reserva | Passa |
| Positivo | DELETE /booking/{id} - Remove reserva | Passa |
| Negativo | POST /auth - Credenciais inválidas | Falha (bug documentado) |
| Negativo | PUT sem token | Passa |
| Negativo | POST sem campos obrigatórios | Passa |
| Negativo | GET ID inexistente | Passa |
| Negativo | DELETE sem ID | Passa |

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

- [Documentação de Testes de API](docs/API_TESTS.md)
- [Documentação de Testes E2E](docs/E2E_TESTS.md)

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
