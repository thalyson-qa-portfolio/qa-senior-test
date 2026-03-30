import { test, expect, type APIResponse } from '@playwright/test';

/** Respostas com corpo JSON devem declarar Content-Type JSON (requisito por método). */
function expectJsonContentType(response: APIResponse) {
  expect(response.headers()['content-type'] || '').toContain('application/json');
}

test.describe('GET /booking', () => {
  test('deve retornar lista de reservas', async ({ request }) => {
    const response = await request.get('/booking');

    expect(response.status()).toBe(200);
    expectJsonContentType(response);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

test.describe('POST /auth', () => {
  test('deve retornar token com credenciais válidas', async ({ request }) => {
    const response = await request.post('/auth', {
      data: {
        username: 'admin',
        password: 'password123',
      },
    });

    expect(response.status()).toBe(200);
    expectJsonContentType(response);

    const body = await response.json();
    expect(body.token).toBeDefined();
  });
});

test.describe('POST /booking', () => {
  test('deve criar uma nova reserva', async ({ request }) => {
    const response = await request.post('/booking', {
      data: {
        firstname: 'João',
        lastname: 'Silva',
        totalprice: 150,
        depositpaid: true,
        bookingdates: {
          checkin: '2026-04-01',
          checkout: '2026-04-05',
        },
        additionalneeds: 'Café da manhã',
      },
    });

    expect(response.status()).toBe(200);
    expectJsonContentType(response);

    const body = await response.json();
    expect(body.bookingid).toBeDefined();
    expect(body.booking.firstname).toBe('João');
  });
});

test.describe('GET /booking/{id}', () => {
  test('deve retornar uma reserva específica', async ({ request }) => {
    const createResponse = await request.post('/booking', {
      data: {
        firstname: 'Maria',
        lastname: 'Santos',
        totalprice: 200,
        depositpaid: true,
        bookingdates: {
          checkin: '2026-05-01',
          checkout: '2026-05-05',
        },
        additionalneeds: 'Almoço',
      },
    });

    const { bookingid } = await createResponse.json();

    const response = await request.get(`/booking/${bookingid}`);

    expect(response.status()).toBe(200);
    expectJsonContentType(response);

    const body = await response.json();
    expect(body.firstname).toBe('Maria');
    expect(body.lastname).toBe('Santos');
  });
});

test.describe('PUT /booking/{id}', () => {
  test('deve atualizar uma reserva com token válido', async ({ request }) => {
    const authResponse = await request.post('/auth', {
      data: { username: 'admin', password: 'password123' },
    });
    const { token } = await authResponse.json();

    const createResponse = await request.post('/booking', {
      data: {
        firstname: 'Carlos',
        lastname: 'Lima',
        totalprice: 100,
        depositpaid: false,
        bookingdates: { checkin: '2026-06-01', checkout: '2026-06-05' },
        additionalneeds: 'Nenhum',
      },
    });
    const { bookingid } = await createResponse.json();

    const response = await request.put(`/booking/${bookingid}`, {
      headers: { Cookie: `token=${token}` },
      data: {
        firstname: 'Carlos',
        lastname: 'Lima',
        totalprice: 250,
        depositpaid: true,
        bookingdates: { checkin: '2026-06-01', checkout: '2026-06-10' },
        additionalneeds: 'Jantar',
      },
    });

    expect(response.status()).toBe(200);
    expectJsonContentType(response);

    const body = await response.json();
    expect(body.totalprice).toBe(250);
    expect(body.depositpaid).toBe(true);
  });
});

test.describe('DELETE /booking/{id}', () => {
  test('deve deletar uma reserva com token válido', async ({ request }) => {
    const authResponse = await request.post('/auth', {
      data: { username: 'admin', password: 'password123' },
    });
    const { token } = await authResponse.json();

    const createResponse = await request.post('/booking', {
      data: {
        firstname: 'Pedro',
        lastname: 'Costa',
        totalprice: 300,
        depositpaid: true,
        bookingdates: { checkin: '2026-07-01', checkout: '2026-07-05' },
        additionalneeds: 'Nenhum',
      },
    });
    const { bookingid } = await createResponse.json();

    const response = await request.delete(`/booking/${bookingid}`, {
      headers: { Cookie: `token=${token}` },
    });

    expect(response.status()).toBe(201);
    // DELETE costuma responder 201 com corpo curto (text/plain), não JSON
    const deleteCt = (response.headers()['content-type'] || '').toLowerCase();
    expect(deleteCt).toMatch(/application\/json|text\/plain/);

    const getResponse = await request.get(`/booking/${bookingid}`);
    expect(getResponse.status()).toBe(404);
  });
});

test.describe('Testes negativos - Autenticação', () => {
  // BUG (Restful-Booker): credenciais inválidas retornam 200 + reason, não 401. Este teste falha até a API seguir RFC.
  test('POST /auth deve rejeitar credenciais inválidas', async ({ request }) => {
    const response = await request.post('/auth', {
      data: { username: 'invalido', password: 'errado' },
    });

    expect(response.status()).toBe(401);
  });

  test('PUT /booking/{id} deve falhar sem token', async ({ request }) => {
    const createResponse = await request.post('/booking', {
      data: {
        firstname: 'Ana',
        lastname: 'Souza',
        totalprice: 100,
        depositpaid: true,
        bookingdates: { checkin: '2026-08-01', checkout: '2026-08-05' },
        additionalneeds: 'Nenhum',
      },
    });
    const { bookingid } = await createResponse.json();

    const response = await request.put(`/booking/${bookingid}`, {
      data: {
        firstname: 'Ana',
        lastname: 'Souza',
        totalprice: 500,
        depositpaid: true,
        bookingdates: { checkin: '2026-08-01', checkout: '2026-08-05' },
        additionalneeds: 'Nenhum',
      },
    });

    expect(response.status()).toBe(403);
  });
});

test.describe('Testes negativos - Payload malformado', () => {
  test('POST /booking deve falhar sem campos obrigatórios', async ({ request }) => {
    const response = await request.post('/booking', {
      data: {
        firstname: 'Teste',
      },
    });

    expect(response.status()).toBe(500);
  });

  test('GET /booking/{id} deve retornar 404 para ID inexistente', async ({ request }) => {
    const response = await request.get('/booking/999999999');

    expect(response.status()).toBe(404);
  });

  test('DELETE /booking sem ID deve falhar', async ({ request }) => {
    const authResponse = await request.post('/auth', {
      data: { username: 'admin', password: 'password123' },
    });
    const { token } = await authResponse.json();

    const response = await request.delete('/booking/', {
      headers: { Cookie: `token=${token}` },
    });

    expect(response.status()).not.toBe(200);
  });
});

test.describe('Testes negativos - Método HTTP não suportado', () => {
  test('PATCH em /booking não deve ser aceito como operação válida', async ({ request }) => {
    const response = await request.fetch('/booking', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: { firstname: 'X' },
    });

    expect(response.ok()).toBe(false);
    expect([400, 404, 405, 501]).toContain(response.status());
  });
});
