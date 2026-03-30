# Documentação: Testes Automatizados E2E

## Visão Geral

Este documento descreve a implementação dos testes automatizados E2E (End-to-End) para o teste técnico de QA Sênior. Os testes foram desenvolvidos usando **Playwright** + **Cucumber** com **TypeScript** no site **Automation Exercise**.

---

## Requisitos do Exercício

### Tarefa 1: Login e Navegação

**Requisitos:**
- Abrir aplicação web, fazer login e navegar até página específica
- Assertivas para validar navegação bem-sucedida
- Fluxos positivos (login válido)
- Fluxos negativos (senha incorreta, usuários inexistentes, campos obrigatórios em branco)
- Page Object Pattern
- Tratamento de erros e estabilidade

**Como foi resolvido:**

| Requisito | Implementação | Arquivo |
|-----------|---------------|---------|
| Abrir aplicação | `navigateToHome()`, `navigate()` | `CheckoutPage.ts`, `LoginPage.ts` |
| Fazer login | `login(email, password)` | `LoginPage.ts` |
| Navegar para página | `navigateToMenu()`, `navigate()` | `ProductsPage.ts` |
| Assertivas de navegação | `getProductsTitle().toBeVisible()` | `navegacao.steps.ts` |
| Login válido | Cenário "Login com credenciais válidas" | `login.feature` |
| Senha incorreta | Cenário "Login com credenciais inválidas" | `login.feature` |
| Campos em branco | Cenário "Login com campos vazios" | `login.feature` |
| Page Object Pattern | `LoginPage`, `CheckoutPage`, `ProductsPage` | `e2e/pages/` |

---

### Tarefa 2: Checkout

**Requisitos:**
- Adição de produtos ao carrinho
- Preenchimento de formulário com dados de pagamento
- Finalização da compra
- Fluxos positivos (compra completa com dados válidos)
- Fluxos negativos (número de cartão inválido, endereço de entrega incompleto)
- Relatório com evidências (incluindo falhas esperadas)

**Como foi resolvido:**

| Requisito | Implementação | Arquivo |
|-----------|---------------|---------|
| Adicionar ao carrinho | `addFirstProductToCart()` | `CheckoutPage.ts` |
| Dados de pagamento | `fillValidCardDetails()` | `CheckoutPage.ts` |
| Finalizar compra | `confirmPayment()` | `CheckoutPage.ts` |
| Checkout válido | Cenário "Checkout completo com sucesso" | `checkout.feature` |
| Cartão inválido | Cenário exige erro e **não** confirmação; falha no Automation Exercise atual | `checkout.feature` + `checkout.steps.ts` |
| Campos vazios | Cenário "Checkout com campos de pagamento vazios" | `checkout.feature` |
| Endereço incompleto | Cenário "Cadastro sem preencher endereço" | `login.feature` |
| Relatório | Cucumber HTML + JSON; **dashboard** (pizzas, features); traces **só em falha** | `reports/`; `cucumber-html-report/` (após `test:e2e`); `traces/` se falhar |

---

## Estrutura de Arquivos

```
qa-senior-test/
├── e2e/                         # Suite E2E (isolada do Playwright API)
│   ├── features/                # Arquivos Gherkin (.feature)
│   │   ├── login.feature
│   │   ├── checkout.feature
│   │   └── navegacao.feature
│   ├── steps/                   # Step Definitions
│   │   ├── login.steps.ts
│   │   ├── checkout.steps.ts
│   │   └── navegacao.steps.ts
│   ├── pages/                   # Page Objects
│   │   ├── LoginPage.ts
│   │   ├── CheckoutPage.ts
│   │   └── ProductsPage.ts
│   └── support/
│       ├── config.ts            # URL base E2E e constantes
│       └── hooks.ts             # Hooks do Cucumber (Before/After)
└── test-output/                 # Relatórios e evidências (gerados)
```

---

## Explicação Técnica Detalhada

### 1. Arquitetura BDD com Cucumber

```
Feature (Gherkin)  →  Step Definitions  →  Page Objects  →  Browser
     ↓                      ↓                   ↓              ↓
login.feature      login.steps.ts      LoginPage.ts      Playwright
```

**Por que Cucumber?**
- Linguagem natural (Gherkin) para descrever cenários
- Fácil entendimento por não-técnicos
- Documentação viva dos testes

---

### 2. Estrutura de uma Feature (Gherkin)

```gherkin
Feature: Login
  Como usuário do site Automation Exercise
  Quero fazer login na minha conta
  Para acessar funcionalidades exclusivas

  Scenario: Login com credenciais válidas
    Given um novo usuário foi cadastrado
    And estou na página de login
    When preencho o email do usuário cadastrado
    And preencho a senha do usuário cadastrado
    And clico no botão de login
    Then devo ver a mensagem "Logged in as"
```

| Elemento | Descrição |
|----------|-----------|
| `Feature` | Funcionalidade sendo testada |
| `Como/Quero/Para` | User story (descrição) |
| `Scenario` | Caso de teste específico |
| `Given` | Pré-condição (setup) |
| `When` | Ação do usuário |
| `Then` | Resultado esperado (assertion) |

---

### 3. Page Object Pattern

O Page Object Pattern centraliza locators e ações de cada página.

#### Estrutura de um Page Object

```typescript
import { Page } from '@playwright/test';
import { BASE_URL } from '../support/config';

export class LoginPage {
  // 1. Locators centralizados
  private readonly emailInput = 'input[data-qa="login-email"]';
  private readonly passwordInput = 'input[data-qa="login-password"]';
  private readonly loginButton = 'button[data-qa="login-button"]';

  // 2. Construtor recebe a página
  constructor(private page: Page) {}

  // 3. Métodos de ação
  async fillEmail(email: string) {
    await this.page.fill(this.emailInput, email);
  }

  async clickLogin() {
    await this.page.click(this.loginButton);
  }

  // 4. Métodos de conveniência (combinam ações)
  async login(email: string, password: string) {
    await this.navigate();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  // 5. Getters para assertions
  getEmailInput() {
    return this.page.locator(this.emailInput);
  }
}
```

**Benefícios:**
- Locators em um lugar só (manutenção fácil)
- Código reutilizável entre testes
- Steps mais legíveis

---

### 4. Step Definitions

Step definitions conectam Gherkin ao código.

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/hooks';
import { LoginPage } from '../pages/LoginPage';

let loginPage: LoginPage;

Given('estou na página de login', async () => {
  loginPage = new LoginPage(page);
  await loginPage.navigate();
});

When('preencho o email {string}', async (email: string) => {
  await loginPage.fillEmail(email);
});

Then('devo ver a mensagem {string}', async (_mensagem: string) => {
  await expect(loginPage.getLoggedInMessageLocator()).toBeVisible();
});
```

| Elemento | Descrição |
|----------|-----------|
| `Given/When/Then` | Decorators que mapeiam Gherkin |
| `{string}` | Captura parâmetro do Gherkin |
| `loginPage` | Instância do Page Object |

---

### 5. Hooks (Before/After)

Hooks executam código antes/depois de cada cenário. Implementação canônica: **[e2e/support/hooks.ts](../e2e/support/hooks.ts)**.

Resumo do comportamento:

- **Trace:** gravação ligada em todo cenário; no **After**, se o cenário **falhou** → `tracing.stop({ path: .../*.zip })` + screenshot; se **passou** → `tracing.stop()` **sem** path (descarta o trace, evitando dezenas de `.zip` quando tudo verde).
- **Vídeo:** só se `VIDEO=true`.
- **CI:** artifact **e2e-report** inclui só o dashboard (`cucumber-html-report/`). O JSON em `reports/` é usado no runner pelo Job Summary e não entra no zip. Com falha, há também **e2e-failure-evidence** (traces, screenshots, videos).

**Recursos de debugging:**
- `HEADLESS=false` - Ver browser executando
- `test-output/traces/` - Playwright Trace Viewer
- `test-output/screenshots/` - Screenshots em falhas

---

### 6. Otimização: API para Setup

Em vez de criar usuário via UI (lento), usamos API.

```typescript
async createAccountViaAPI(email: string, password: string) {
  await this.page.request.post(`${BASE_URL}/api/createAccount`, {
    form: {
      name: 'Usuario Teste',
      email,
      password,
      // ... outros campos
    },
  });
}
```

**Benefícios:**
- ~3 segundos em vez de ~10 segundos
- Menos flakiness (menos interações UI)
- Traces mostram a chamada API

**Princípio:** "Use a UI para testar a UI, use a API para setup."

---

### 7. Configuração Centralizada

```typescript
// e2e/support/config.ts
export const BASE_URL = 'https://automationexercise.com';
```

**Benefício:** URL em um lugar só. Se mudar (staging, prod), altera uma linha.

---

## Cenários Implementados

### Login (4 cenários)

| # | Cenário | Tipo | O que valida |
|---|---------|------|--------------|
| 1 | Login com credenciais válidas | Positivo | Usuário consegue logar |
| 2 | Login com credenciais inválidas | Negativo | Sistema rejeita senha errada |
| 3 | Login com campos vazios | Negativo | Sistema exige campos obrigatórios |
| 4 | Cadastro sem preencher endereço | Negativo | Sistema exige endereço |

### Checkout (3 cenários)

| # | Cenário | Tipo | O que valida |
|---|---------|------|--------------|
| 5 | Checkout completo com sucesso | Positivo | Fluxo completo funciona |
| 6 | Checkout com campos vazios | Negativo | Sistema exige dados do cartão |
| 7 | Checkout com cartão inválido | Negativo | Espera recusa + mensagem de erro; no site demo o pedido é confirmado — **cenário falha** e sinaliza bug (igual ideia do POST /auth na API) |

### Navegação (3 cenários)

| # | Cenário | Tipo | O que valida |
|---|---------|------|--------------|
| 8 | Navegar para página de produtos | Positivo | Menu funciona |
| 9 | Navegar para categoria | Positivo | Filtro por categoria funciona |
| 10 | Buscar produto | Positivo | Busca retorna resultados |

---

## Como Executar

### Pré-requisitos

- Node.js 18+ (o CI em GitHub Actions usa Node 20)
- npm

### Instalação

```bash
npm install
npx playwright install chromium
```

### Executar Testes

```bash
# Todos os testes E2E
npm run test:e2e

# Com browser visível
HEADLESS=false npm run test:e2e

# Em câmera lenta (debug)
SLOWMO=500 npm run test:e2e
```

### Ver Relatórios

```bash
# Dashboard (pizzas, metadados, cards por feature) — gerado ao final de npm run test:e2e
open test-output/cucumber-html-report/index.html

# Relatório Cucumber HTML oficial (lista de steps)
open test-output/reports/cucumber-report.html

# Regerar só o dashboard a partir do JSON já existente
npm run report:e2e

# Trace Viewer (só quando o cenário falha — ver hooks)
npx playwright show-trace test-output/traces/<nome_do_cenario>.zip
```

**Dashboard:** o pacote `multiple-cucumber-html-reporter` lê `test-output/reports/cucumber-results.json` (gerado pelo Cucumber conforme [cucumber.js](../cucumber.js)). O wrapper [scripts/run-e2e.js](../scripts/run-e2e.js) executa o Cucumber e, em seguida, gera `test-output/cucumber-html-report/`. **Não exige Java.** No GitHub Actions o artifact **e2e-report** contém apenas `cucumber-html-report/`; após baixar o zip, abra `index.html` (mantendo `assets/` ao lado).

---

## Page Objects Criados

### LoginPage.ts

| Método | Descrição |
|--------|-----------|
| `navigate()` | Vai para /login |
| `fillEmail(email)` | Preenche email |
| `fillPassword(password)` | Preenche senha |
| `clickLogin()` | Clica no botão login |
| `login(email, password)` | Fluxo completo de login |
| `createAccountViaAPI(email, password)` | Cria conta via API |
| `navigateToSignup()` | Vai para formulário de cadastro |
| `fillSignupBasicData()` | Preenche dados básicos |

### CheckoutPage.ts

| Método | Descrição |
|--------|-----------|
| `navigateToHome()` | Vai para homepage |
| `addFirstProductToCart()` | Adiciona primeiro produto |
| `goToCart()` | Vai para carrinho |
| `proceedToCheckout()` | Avança para checkout |
| `fillValidCardDetails()` | Preenche cartão válido |
| `fillInvalidCardDetails()` | Preenche cartão inválido |
| `clearCardFields()` | Limpa campos do cartão |
| `confirmPayment()` | Confirma pagamento |

### ProductsPage.ts

| Método | Descrição |
|--------|-----------|
| `navigate()` | Vai para /products |
| `navigateToMenu(menu)` | Navega para menu específico |
| `clickCategory(category)` | Clica em categoria |
| `clickSubcategory(subcategory)` | Clica em subcategoria |
| `search(term)` | Busca produto |

---

## Boas Práticas Aplicadas

| Prática | Implementação |
|---------|---------------|
| Page Object Pattern | 3 Page Objects criados |
| DRY (Don't Repeat Yourself) | Locators centralizados |
| Testes independentes | Cada cenário cria seus dados |
| API para setup | `createAccountViaAPI()` |
| Configuração centralizada | `config.ts` com BASE_URL |
| Debugging | Traces, screenshots, headed mode |
| BDD | Gherkin em português |

---

## Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Playwright | 1.58.2 | Automação de browser |
| Cucumber | 11.3.0 | Framework BDD |
| multiple-cucumber-html-reporter | 3.x | Dashboard HTML a partir do JSON (pizzas, features) |
| TypeScript | 6.0.2 | Linguagem |
| Node.js | 18+ (CI: 20) | Runtime |

---

## Referências

- [Playwright Documentation](https://playwright.dev/)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [multiple-cucumber-html-reporter (npm)](https://www.npmjs.com/package/multiple-cucumber-html-reporter)
- [Automation Exercise](https://automationexercise.com/)
- [Page Object Pattern](https://martinfowler.com/bliki/PageObject.html)

---

*Documentação criada em: Março 2026*
