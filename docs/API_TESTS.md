# Documentação: Testes Automatizados de API

## Visão Geral

Este documento descreve a implementação dos testes automatizados de API para o teste técnico de QA Sênior. Os testes foram desenvolvidos usando **Playwright** com **TypeScript** contra a API **Restful-Booker**.

---

## Requisitos do Exercício

### Tarefa 1: Testes de Validação de Endpoints

**Requisitos:**
- Verificações de resposta (status codes, headers e corpo)
- Testes positivos (entradas válidas)
- Testes negativos (dados inválidos, campos ausentes, autenticação inválida)

**Como foi resolvido:**

| Requisito | Implementação | Arquivo/Linha |
|-----------|---------------|---------------|
| Status codes | `expect(response.status()).toBe(200)` | Todos os testes |
| Headers | `expect(response.headers()['content-type']).toContain('application/json')` | Linha 8 |
| Corpo | `expect(body.firstname).toBe('João')` | Múltiplos testes |
| Testes positivos | 6 testes cobrindo GET, POST, PUT, DELETE | Linhas 3-149 |
| Testes negativos | 5 testes cobrindo erros | Linhas 152-219 |

---

### Tarefa 2: Testes de Múltiplos Endpoints

**Requisitos:**
- Automatizar testes para GET, POST, PUT, DELETE
- Validar status codes, headers e corpo para cada método
- Cenários negativos (métodos inválidos, payloads malformados, dados ausentes)
- Gerar relatório detalhado

**Como foi resolvido:**

| Método HTTP |     Endpoint   | Teste Positivo   |    Teste Negativo           |
|-------------|----------------|------------------|-----------------------------|
|     GET     | `/booking`     | Lista reservas   | -                           |
|     GET     | `/booking/{id}`| Busca específica | ID inexistente (404)        |
|     POST    | `/auth`        | Gera token       | Credenciais inválidas (401) |
|     POST    | `/booking`     | Cria reserva     | Campos ausentes (500)       |
|     PUT     | `/booking/{id}`| Atualiza reserva | Sem token (403)             |
|    DELETE   | `/booking/{id}`| Remove reserva   | Sem ID                      |

**Relatório:** Gerado automaticamente pelo Playwright em `test-output/playwright-report/`.

---

## Estrutura do Arquivo de Testes

```
tests/api/booking.spec.ts
```

### Organização

```typescript
// 1. Imports
import { test, expect } from '@playwright/test';

// 2. Testes Positivos (agrupados por endpoint)
test.describe('GET /booking', () => {...});
test.describe('POST /auth', () => {...});
test.describe('POST /booking', () => {...});
test.describe('GET /booking/{id}', () => {...});
test.describe('PUT /booking/{id}', () => {...});
test.describe('DELETE /booking/{id}', () => {...});

// 3. Testes Negativos (agrupados por categoria)
test.describe('Testes negativos - Autenticação', () => {...});
test.describe('Testes negativos - Payload malformado', () => {...});
```

---

## Explicação Técnica Detalhada

### 1. Configuração (playwright.config.ts)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',           // Pasta onde estão os testes
  timeout: 30000,               // Timeout de 30s por teste
  use: {
    baseURL: 'https://restful-booker.herokuapp.com', // URL base da API
    extraHTTPHeaders: {
      'Accept': 'application/json', // Header padrão em todas requisições
    },
  },
  reporter: [['html', { open: 'never' }]], // Gera relatório HTML
});
```

**Por que essas configurações?**
- `baseURL`: Evita repetir a URL completa em cada requisição
- `extraHTTPHeaders`: Garante que a API retorne JSON
- `reporter: 'html'`: Atende ao requisito de gerar relatório

---

### 2. Fazendo Requisições HTTP

#### GET (Buscar dados)

```typescript
const response = await request.get('/booking');
```

- `await`: Espera a resposta da API
- `request`: Objeto injetado pelo Playwright
- `.get()`: Método HTTP GET

#### POST (Enviar dados)

```typescript
const response = await request.post('/auth', {
  data: {
    username: 'admin',
    password: 'password123',
  },
});
```

- `data`: Corpo da requisição (convertido para JSON automaticamente)

#### PUT (Atualizar dados)

```typescript
const response = await request.put(`/booking/${bookingid}`, {
  headers: { Cookie: `token=${token}` },
  data: { /* dados atualizados */ },
});
```

- Template string `` `${bookingid}` ``: Insere variável na URL
- `headers`: Headers adicionais (autenticação)

#### DELETE (Remover dados)

```typescript
const response = await request.delete(`/booking/${bookingid}`, {
  headers: { Cookie: `token=${token}` },
});
```

---

### 3. Validações (Assertions)

#### Validar Status Code

```typescript
expect(response.status()).toBe(200);
```

| Método | Descrição |
|--------|-----------|
| `.toBe(200)` | Igual a 200 |
| `.not.toBe(200)` | Diferente de 200 |

#### Validar Header

```typescript
expect(response.headers()['content-type']).toContain('application/json');
```

| Método | Descrição |
|--------|-----------|
| `.toContain()` | Contém o texto |

#### Validar Body

```typescript
const body = await response.json();
expect(body.token).toBeDefined();
expect(body.firstname).toBe('João');
expect(Array.isArray(body)).toBe(true);
```

| Método | Descrição |
|--------|-----------|
| `.toBeDefined()` | Existe (não é undefined) |
| `.toBe('valor')` | Igual ao valor |
| `Array.isArray()` | Verifica se é array |

---

### 4. Autenticação da API

A API Restful-Booker usa autenticação via **Cookie**.

#### Fluxo:

```
1. POST /auth (com username/password)
   ↓
2. Recebe { token: "abc123..." }
   ↓
3. Usa token nas próximas requisições
   ↓
4. headers: { Cookie: `token=${token}` }
```

#### Código:

```typescript
// Passo 1: Obter token
const authResponse = await request.post('/auth', {
  data: { username: 'admin', password: 'password123' },
});
const { token } = await authResponse.json();

// Passo 2: Usar token
const response = await request.put(`/booking/${id}`, {
  headers: { Cookie: `token=${token}` },
  data: { /* dados */ },
});
```

---

### 5. Testes Independentes

Cada teste cria seus próprios dados. Isso é uma **boa prática**.

#### Por que não usar IDs fixos?

| Abordagem | Problema |
|-----------|----------|
| Usar ID fixo (ex: ID 1) | Se alguém deletar, o teste quebra |
| Criar no teste | Sempre funciona |

#### Exemplo (teste DELETE):

```typescript
test('deve deletar uma reserva', async ({ request }) => {
  // 1. Criar dados próprios
  const createResponse = await request.post('/booking', {
    data: { /* dados */ },
  });
  const { bookingid } = await createResponse.json();

  // 2. Executar ação
  const response = await request.delete(`/booking/${bookingid}`, {...});

  // 3. Validar resultado
  expect(response.status()).toBe(201);

  // 4. Validar efeito colateral
  const getResponse = await request.get(`/booking/${bookingid}`);
  expect(getResponse.status()).toBe(404); // Não existe mais
});
```

---

### 6. Testes Negativos

Testes que validam comportamento quando algo está **errado**.

| Cenário | O que testamos | Resultado esperado |
|---------|----------------|-------------------|
| Credenciais inválidas | Login com dados errados | 401 Unauthorized |
| Sem autenticação | PUT sem token | 403 Forbidden |
| Campos ausentes | POST incompleto | 500 Internal Error |
| ID inexistente | GET com ID inválido | 404 Not Found |
| Método incompleto | DELETE sem ID | Erro |

---

## Bug Identificado

Durante os testes, foi identificado um bug na API:

### Descrição

**Endpoint:** POST /auth  
**Cenário:** Credenciais inválidas  
**Esperado:** Status 401 Unauthorized  
**Atual:** Status 200 OK com body `{"reason":"Bad credentials"}`

### Impacto

- Viola padrão REST
- Clientes HTTP não detectam erro automaticamente
- Ferramentas de monitoramento não alertam
- Cache pode armazenar resposta de erro

### No código

```typescript
// BUG: API retorna 200 com body {"reason":"Bad credentials"} em vez de 401
test('POST /auth deve rejeitar credenciais inválidas', async ({ request }) => {
  const response = await request.post('/auth', {
    data: { username: 'invalido', password: 'errado' },
  });

  expect(response.status()).toBe(401); // Falha até a API retornar 401 (RFC)
});
```

No Job Summary do GitHub Actions (suíte API), a seção **Falhas (cenario, esperado e encontrado)** usa o `results.json` do Playwright para listar testes com `ok: false`, com **resultado esperado** e **encontrado** extraídos da mensagem de erro (ex.: `Expected: 401` / `Received: 200`).

---

## Como Executar

### Pré-requisitos

- Node.js 18+
- npm

### Instalação

```bash
npm install
npx playwright install chromium
```

### Executar Testes

```bash
npm run test:api
```

### Ver Relatório

```bash
npx playwright show-report test-output/playwright-report
```

---

## Resumo dos Testes

| # | Teste | Tipo | Status |
|---|-------|------|--------|
| 1 | GET /booking (lista + header) | Positivo | ✅ Passa |
| 2 | POST /auth (token) | Positivo | ✅ Passa |
| 3 | POST /booking (criar) | Positivo | ✅ Passa |
| 4 | GET /booking/{id} | Positivo | ✅ Passa |
| 5 | PUT /booking/{id} | Positivo | ✅ Passa |
| 6 | DELETE /booking/{id} | Positivo | ✅ Passa |
| 7 | POST /auth credenciais inválidas | Negativo | ❌ Falha (bug) |
| 8 | PUT sem token | Negativo | ✅ Passa |
| 9 | POST sem campos obrigatórios | Negativo | ✅ Passa |
| 10 | GET ID inexistente | Negativo | ✅ Passa |
| 11 | DELETE sem ID | Negativo | ✅ Passa |

**Total:** 10 passando, 1 falhando (bug documentado)

---

## Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Playwright | 1.58.2 | Framework de testes |
| TypeScript | 6.0.2 | Linguagem |
| Node.js | 18+ | Runtime |

---

## Referências

- [Playwright Documentation](https://playwright.dev/docs/api-testing)
- [Restful-Booker API](https://restful-booker.herokuapp.com/apidoc/index.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

*Documentação criada em: Março 2026*
