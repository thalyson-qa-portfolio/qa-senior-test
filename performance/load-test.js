import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Metricas customizadas
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

// Configuracao do teste
export const options = {
  stages: [
    { duration: '1m', target: 500 },   // Ramp-up: 0 -> 500 usuarios em 1 min
    { duration: '5m', target: 500 },   // Carga: manter 500 usuarios por 5 min
    { duration: '1m', target: 0 },     // Ramp-down: 500 -> 0 usuarios em 1 min
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% das requests devem ser < 2s
    http_req_failed: ['rate<0.1'],       // Taxa de falha deve ser < 10%
    errors: ['rate<0.1'],                // Erros customizados < 10%
  },
};

// API oficial do K6 para testes de carga
const BASE_URL = 'https://test.k6.io';

export default function () {
  // Cenario 1: Pagina inicial
  const homeResponse = http.get(`${BASE_URL}/`);
  
  check(homeResponse, {
    'GET / status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  requestDuration.add(homeResponse.timings.duration);
  
  sleep(1);
  
  // Cenario 2: Lista de contatos (simula API)
  const contactsResponse = http.get(`${BASE_URL}/contacts.php`);
  
  check(contactsResponse, {
    'GET /contacts status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  requestDuration.add(contactsResponse.timings.duration);
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const metrics = data.metrics;
  
  let summary = '\n';
  summary += '='.repeat(60) + '\n';
  summary += '  RESULTADO DO TESTE DE CARGA\n';
  summary += '='.repeat(60) + '\n\n';
  
  summary += `  Total de Requests:     ${metrics.http_reqs.values.count}\n`;
  summary += `  Requests com Falha:    ${metrics.http_req_failed.values.passes}\n`;
  summary += `  Taxa de Falha:         ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n\n`;
  
  summary += `  Tempo de Resposta:\n`;
  summary += `    - Media:             ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `    - Minimo:            ${metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
  summary += `    - Maximo:            ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  summary += `    - P90:               ${metrics.http_req_duration.values['p(90)'].toFixed(2)}ms\n`;
  summary += `    - P95:               ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  
  summary += `  Usuarios Virtuais:     ${metrics.vus_max.values.max}\n`;
  summary += `  Iteracoes:             ${metrics.iterations.values.count}\n\n`;
  
  summary += '='.repeat(60) + '\n';
  
  return summary;
}
