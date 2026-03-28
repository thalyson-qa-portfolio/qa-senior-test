# Contexto do Projeto - QA Senior Test

## Objetivo
Projeto de teste técnico para vaga de **QA Sênior** cobrindo:
- Testes de API (Playwright)
- Testes E2E (Playwright + Cucumber + TypeScript)
- Pipeline CI/CD (GitHub Actions)
- Teste de Performance (K6)

---

## Decisões Técnicas Tomadas

### Stack Definida
| Tecnologia | Uso |
|------------|-----|
| Playwright | Testes E2E e API |
| TypeScript | Linguagem principal |
| Cucumber | BDD com Gherkin |
| GitHub Actions | CI/CD |
| K6 | Testes de performance |

### Aplicações de Teste
| Tipo | Site | URL |
|------|------|-----|
| **E2E** | Automation Exercise | https://automationexercise.com |
| **API** | Restful-Booker | https://restful-booker.herokuapp.com |
| **K6** | Restful-Booker | https://restful-booker.herokuapp.com |

### Por que essas escolhas?
- **Automation Exercise**: Cobre 100% dos requisitos E2E (login, carrinho, checkout com cartão)
- **Restful-Booker**: API REST completa com autenticação, CRUD, cenários negativos

---

## Fases do Projeto

| Fase | Descrição | Status |
|------|-----------|--------|
| FASE 1 | Setup inicial do projeto | ✅ Concluído |
| FASE 2 | Base mínima para testes de API | ✅ Concluído |
| FASE 3 | Expansão dos testes de API | ✅ Concluído |
| FASE 4 | Base mínima para E2E com Cucumber | ✅ Concluído |
| FASE 5 | Expansão dos testes E2E | ✅ Concluído |
| FASE 6 | Pipeline com GitHub Actions | ✅ Concluído |
| FASE 7 | Performance com K6 | ⏳ Pendente |
| FASE 8 | README e acabamento final | ⏳ Pendente |

---

## FASE 1 - Progresso Detalhado

### Etapas da FASE 1
| Etapa | Descrição | Status |
|-------|-----------|--------|
| 1.1 | Criar projeto e estrutura de pastas | ✅ Concluído |
| 1.2 | Instalar dependências | ✅ Concluído |
| 1.3 | Criar tsconfig.json | ✅ Concluído |
| 1.4 | Criar playwright.config.ts | ✅ Concluído |
| 1.5 | Criar cucumber.js | ✅ Concluído |
| 1.6 | Criar .env.example e .gitignore | ✅ Concluído |
| 1.7 | Atualizar package.json com scripts | ✅ Concluído |
| 1.8 | Criar README.md inicial | ✅ Concluído |

### Estrutura de Pastas Criada
```
qa-senior-test/
├── .github/workflows/  # Pipeline CI/CD (FASE 6)
├── features/           # Arquivos .feature (FASE 4)
├── pages/              # Page Objects (FASE 4-5)
├── steps/              # Step definitions (FASE 4)
├── support/            # Hooks Cucumber (FASE 4)
├── tests/api/          # Testes de API (FASE 2-3)
├── performance/        # Scripts K6 (FASE 7)
├── utils/              # Helpers
└── package.json        # ✅ Criado
```

---

## Próximo Passo: FASE 4

### Objetivo da FASE 4
Criar a base mínima para testes E2E com Cucumber no site Automation Exercise.

### Etapas previstas:
| Etapa | Descrição |
|-------|-----------|
| 4.1 | Criar primeiro arquivo .feature (login) |
| 4.2 | Criar step definitions |
| 4.3 | Criar Page Object para login |
| 4.4 | Configurar hooks do Cucumber |
| 4.5 | Validar que os testes rodam com `npm run test:e2e` |

---

## Requisitos do Teste Técnico (Resumo)

### 1. Testes de API
- Validar status codes, headers, body
- Testes positivos e negativos
- Métodos: GET, POST, PUT, DELETE
- Cenários: payloads malformados, autenticação inválida
- Gerar relatório

### 2. Testes E2E (Cucumber)
- Login (positivo e negativo)
- Navegação
- Checkout completo (carrinho, dados de pagamento, finalização)
- Cenários negativos (cartão inválido, campos obrigatórios)
- Page Object Pattern
- Gerar relatório com evidências

### 3. CI/CD
- Pipeline GitHub Actions
- Executar testes de API e E2E após cada commit
- Relatório das execuções

### 4. Performance (K6)
- 500 usuários simultâneos por 5 minutos
- Métricas e identificação de gargalos
- Relatório de análise

---

## Regras de Condução

1. **Passos pequenos** - Não implementar grandes blocos de uma vez
2. **Explicar antes** - Sempre explicar o que será feito
3. **Explicar depois** - Detalhar o código linha por linha quando necessário
4. **Aguardar confirmação** - Esperar aprovação antes de avançar
5. **Sem abstrações prematuras** - Manter simples até precisar de mais
6. **Zero retrabalho** - Fazer certo da primeira vez

---

## Como Continuar

Ao abrir este projeto em um novo chat, diga:

> "Leia o arquivo CONTEXTO_PROJETO.md e continue de onde paramos. Estou na FASE 4 (testes E2E com Cucumber)."

---

*Arquivo gerado em: Março 2026*
