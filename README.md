# QA Senior Test

Projeto de automação de testes desenvolvido como avaliação técnica para vaga de **QA Sênior**. O projeto cobre testes de API, testes E2E com BDD, integração CI/CD e testes de performance.

### Resumo para o avaliador

Os mesmos serviços públicos têm **comportamentos documentados** que não batem com o contrato ideal: **POST /auth** com credenciais inválidas deveria retornar **401**, mas a Restful-Booker responde **200**; no E2E, **checkout com cartão inválido** deveria recusar com mensagem, mas o Automation Exercise pode confirmar o pedido. Esses casos estão **em quarentena no CI** (`test.fixme` na API; tag `@known_issue` excluída no E2E com `npm run test:e2e:ci`) para o pipeline permanecer verde e confiável; a suíte **completa** localmente continua em [docs/API_TESTS.md](docs/API_TESTS.md) e [docs/E2E_TESTS.md](docs/E2E_TESTS.md). No **CI**, o job de performance corre **`test:perf:smoke:ci`** com perfil definido por **GitHub Variables** `K6_*` (defaults leves no workflow se não definires nada); o cenario completo do desafio (**500 VUs**, ~**7 min**) está descrito em [docs/PERFORMANCE_TESTS.md](docs/PERFORMANCE_TESTS.md), executável com `npm run test:perf` ou com variables ajustadas.

---

## Tecnologias e Versões

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 18+ (CI: 20) | Runtime |
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

Configurações compartilhadas entre API (Playwright) e E2E ficam em `e2e/support/config.ts` (`API_BASE_URL` e `E2E_BASE_URL` via `process.env`, com defaults; ver secção **Variáveis de ambiente** abaixo).

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
│   └── load-test.js             # Script K6 (500 VUs, platô 5 min; ~7 min totais)
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

- **Node.js** 18 ou superior (o pipeline em GitHub Actions usa **Node 20**)
- **npm** (incluso com Node.js)
- **K6** 1.x (apenas para `npm run test:perf`; ver secao Instalacao, passo 4)

Verificar versão instalada:
```bash
node --version  # v18.x.x ou superior (CI: 20.x)
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

3. (Opcional) URLs por ambiente — copie `.env.example` para `.env` na raiz e ajuste `API_BASE_URL` / `E2E_BASE_URL` se precisar de outro alvo. O ficheiro `.env` é carregado automaticamente ao importar `e2e/support/config.ts` (Playwright e Cucumber). Sem `.env`, usam-se os defaults (Restful-Booker e Automation Exercise).

4. Instale os browsers do Playwright:
```bash
npx playwright install chromium
```

5. (Opcional) Para testes de carga, instale o [K6](https://k6.io/docs/get-started/installation/):
```bash
brew install k6   # macOS
k6 version
```

### Variáveis de ambiente (URLs)

| Variável | Default (se omitida) | Uso |
|----------|----------------------|-----|
| `API_BASE_URL` | `https://restful-booker.herokuapp.com` | Testes de API (Playwright `baseURL` em `playwright.config.ts`) |
| `E2E_BASE_URL` | `https://automationexercise.com` | Navegação e requests E2E (Cucumber + Playwright) |

Definição: ficheiro **`.env`** na raiz (ver [`.env.example`](.env.example)) ou `export VAR=valor` no shell. Variáveis já definidas no ambiente têm precedência sobre o `.env` (comportamento do `dotenv`). Leitura central em [`e2e/support/config.ts`](e2e/support/config.ts).

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

Executa testes E2E com Cucumber no site [Automation Exercise](https://automationexercise.com/) — **todos** os cenários, incluindo os com `@known_issue` (podem falhar por bug do demo).

Mesmo conjunto que o **CI** usa (exclui `@known_issue`):

```bash
npm run test:e2e:ci
```

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

Mesmo script que stages (`npm run test:perf:smoke`); defaults = carga completa do script salvo env:

```bash
npm run test:perf:smoke
```

**Documentacao:** [docs/PERFORMANCE_TESTS.md](docs/PERFORMANCE_TESTS.md)

### Todos os Testes (mesmo criterio do CI)

```bash
npm test
```

Executa API e E2E com `test:e2e:ci` (exclui cenários `@known_issue`; não inclui K6). É o comando mais útil para validar tudo **verde** antes de um PR.

Suíte **completa** (inclui checkout com cartão inválido — pode falhar por bug do demo):

```bash
npm run test:all
```

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

O K6 imprime um resumo no terminal ao final de `npm run test:perf`. **URL, stages, thresholds e pausa** podem ser ajustados por variáveis `K6_*` (`__ENV`); ver tabela em [docs/PERFORMANCE_TESTS.md](docs/PERFORMANCE_TESTS.md).

Para exportar JSON:

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
| `e2e-tests` | E2E com Chromium (`test:e2e:ci` — sem `@known_issue`) | ~2-3 min |
| `performance-tests` | K6 (`test:perf:smoke:ci`, stages via Variables; ~30s se sem vars no GitHub) + Node 20 / `npm ci` | ~1–2 min (smoke default) |

A carga completa (500 VUs, varios minutos) continua apenas localmente via `npm run test:perf`; o CI valida o script e o alvo com execucao leve.

Opcionalmente, podes definir **Variables** no GitHub (`Settings → Actions → Variables`) com nomes `K6_*` — o workflow injeta-as no job de performance; ver [docs/PERFORMANCE_TESTS.md](docs/PERFORMANCE_TESTS.md).

**Gate:** se algum teste falhar, o job correspondente **falha** (vermelho no PR). Job Summary e upload de artifacts usam `if: always()`, entao relatorios e evidencias continuam gerados mesmo com falha.

### Artifacts (Relatorios)

Apos cada execucao, os relatorios ficam disponiveis na aba **Actions** do GitHub:

| Artifact | Conteudo |
|----------|----------|
| `api-report` | `test-output/playwright-report/` |
| `e2e-report` | Dashboard E2E (`cucumber-html-report/` — abrir `index.html`) |
| `e2e-failure-evidence` | Só se algum cenario falhar: traces (`.zip`), screenshots, videos |
| `k6-report` | Log da execução (`k6-output.txt`) + `test-output/k6/k6-results.json` (métricas) e `k6-summary.json` (resumo) |

**Como acessar:**
1. Va para a aba "Actions" no GitHub
2. Clique na execucao desejada
3. Role ate "Artifacts"
4. Baixe o zip do relatorio

---

## Cenários de Teste

### API (12 testes no código; 11 executados no CI)

O teste de credenciais inválidas em **POST /auth** documenta o bug da API (espera **401**, recebe **200**) e está marcado com **`test.fixme`** — não executa no relatório como falha e **não bloqueia** o pipeline. No **CI**, a suíte API fica **11 passed + 1 fixme** (ver [docs/API_TESTS.md](docs/API_TESTS.md)).

| Tipo | Cenário | Status |
|------|---------|--------|
| Positivo | GET /booking - Lista reservas | Passa |
| Positivo | POST /auth - Gera token | Passa |
| Positivo | POST /booking - Cria reserva | Passa |
| Positivo | GET /booking/{id} - Busca específica | Passa |
| Positivo | PUT /booking/{id} - Atualiza reserva | Passa |
| Positivo | DELETE /booking/{id} - Remove reserva | Passa |
| Negativo | POST /auth - Credenciais inválidas | fixme (bug documentado — API retorna 200) |
| Negativo | PUT sem token | Passa |
| Negativo | POST sem campos obrigatórios | Passa |
| Negativo | GET ID inexistente | Passa |
| Negativo | DELETE sem ID | Passa |
| Negativo | PATCH /booking - Método não suportado | Passa |

**Resumo (CI):** 11 passando, 1 fixme (known issue Restful-Booker).

### E2E (10 cenários no código; 9 no CI)

No **CI** usa-se `npm run test:e2e:ci`, que exclui cenários com **`@known_issue`** (checkout com cartão inválido — bug comum no demo). Localmente, `npm run test:e2e` roda os **10** cenários; o cenário em quarentena pode falhar até o site passar a recusar o cartão (ver [docs/E2E_TESTS.md](docs/E2E_TESTS.md)).

| Feature | Cenário | Tipo |
|---------|---------|------|
| Login | Credenciais válidas | Positivo |
| Login | Credenciais inválidas | Negativo |
| Login | Campos vazios | Negativo |
| Login | Cadastro sem endereço | Negativo |
| Checkout | Completo com sucesso | Positivo |
| Checkout | Campos de pagamento vazios | Negativo |
| Checkout | Cartão inválido | Negativo (excluído no CI — `@known_issue`) |
| Navegação | Página de produtos | Positivo |
| Navegação | Categoria de produtos | Positivo |
| Navegação | Buscar produto | Positivo |

**Resumo (CI):** 9 cenários executados, esperado **verde**; suíte completa local = 10 cenários.

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
