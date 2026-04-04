import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// --- Env (__ENV). Defaults = cenario completo do desafio (500 VUs, platô 5m, test.k6.io). ---
// | Variavel            | Significado |
// | K6_BASE_URL         | Origem HTTP |
// | K6_TARGET_VUS / K6_VUS | VUs no platô (alias opcional) |
// | K6_RAMP_DURATION    | Ramp-up |
// | K6_LOAD_DURATION    | Platô (duracao principal / "duration" do cenario) |
// | K6_RAMP_DOWN_DURATION | Ramp-down |
// | K6_SLEEP_S, K6_P95_MS, K6_HTTP_FAIL_RATE_MAX, K6_ERRORS_RATE_MAX | ver tabela na doc |
// CI injeta K6_* via GitHub Variables (workflow). Sem --vus/--duration no npm: stages aplicam-se.

function envStr(key, defaultVal) {
  const v = __ENV[key];
  return v !== undefined && String(v).length > 0 ? String(v) : defaultVal;
}

function envInt(key, defaultVal) {
  const v = __ENV[key];
  if (v === undefined || v === '') return defaultVal;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultVal;
}

function envFloat(key, defaultVal) {
  const v = __ENV[key];
  if (v === undefined || v === '') return defaultVal;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : defaultVal;
}

/** Base URL sem barra final */
const BASE_URL = envStr('K6_BASE_URL', 'https://test.k6.io').replace(/\/+$/, '');

const rampDuration = envStr('K6_RAMP_DURATION', '1m');
const loadDuration = envStr('K6_LOAD_DURATION', '5m');
const rampDownDuration = envStr('K6_RAMP_DOWN_DURATION', '1m');
const targetVus = Math.max(0, envInt('K6_TARGET_VUS', envInt('K6_VUS', 500)));

const sleepSeconds = Math.max(0, envFloat('K6_SLEEP_S', 1));

const p95MaxMs = envInt('K6_P95_MS', 2000);
const httpFailRateMax = envStr('K6_HTTP_FAIL_RATE_MAX', '0.1');
const errorsRateMax = envStr('K6_ERRORS_RATE_MAX', '0.1');

// Metricas customizadas
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

export const options = {
  stages: [
    { duration: rampDuration, target: targetVus },
    { duration: loadDuration, target: targetVus },
    { duration: rampDownDuration, target: 0 },
  ],
  thresholds: {
    http_req_duration: [`p(95)<${p95MaxMs}`],
    http_req_failed: [`rate<${httpFailRateMax}`],
    errors: [`rate<${errorsRateMax}`],
  },
};

export default function () {
  const homeResponse = http.get(`${BASE_URL}/`);

  check(homeResponse, {
    'GET / status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  requestDuration.add(homeResponse.timings.duration);

  if (sleepSeconds > 0) sleep(sleepSeconds);

  const contactsResponse = http.get(`${BASE_URL}/contacts.php`);

  check(contactsResponse, {
    'GET /contacts status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  requestDuration.add(contactsResponse.timings.duration);

  if (sleepSeconds > 0) sleep(sleepSeconds);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data == null ? {} : data),
  };
}

function valuesOf(metrics, name) {
  if (!metrics || !metrics[name] || !metrics[name].values) return null;
  return metrics[name].values;
}

function fmtMs(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'n/d';
  return `${v.toFixed(2)}ms`;
}

function textSummary(data) {
  const raw = data && typeof data === 'object' ? data : {};
  const metrics = raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : {};
  const reqs = valuesOf(metrics, 'http_reqs');
  const failed = valuesOf(metrics, 'http_req_failed');
  const dur = valuesOf(metrics, 'http_req_duration');
  const vusMax = valuesOf(metrics, 'vus_max');
  const iters = valuesOf(metrics, 'iterations');

  const totalReq = reqs && typeof reqs.count === 'number' ? reqs.count : null;
  const failRate = failed && typeof failed.rate === 'number' ? failed.rate : null;
  let failedReqEst = null;
  if (totalReq !== null && failRate !== null) {
    failedReqEst = Math.round(totalReq * failRate);
  }

  let summary = '\n';
  summary += '='.repeat(60) + '\n';
  summary += '  RESULTADO DO TESTE DE CARGA\n';
  summary += '='.repeat(60) + '\n\n';

  summary += `  Base URL:              ${BASE_URL}\n`;
  summary += `  Total de Requests:     ${totalReq !== null ? totalReq : 'n/d'}\n`;
  summary += `  Req. HTTP falhadas (est.): ${failedReqEst !== null ? failedReqEst : 'n/d'}\n`;
  summary += `  Taxa falha HTTP:       ${failRate !== null ? (failRate * 100).toFixed(2) + '%' : 'n/d'}\n\n`;

  summary += '  Tempo de Resposta (http_req_duration):\n';
  if (dur && typeof dur === 'object') {
    summary += `    - Media:             ${fmtMs(typeof dur.avg === 'number' ? dur.avg : null)}\n`;
    summary += `    - Minimo:            ${fmtMs(typeof dur.min === 'number' ? dur.min : null)}\n`;
    summary += `    - Maximo:            ${fmtMs(typeof dur.max === 'number' ? dur.max : null)}\n`;
    const p90 = dur['p(90)'];
    const p95 = dur['p(95)'];
    summary += `    - P90:               ${fmtMs(typeof p90 === 'number' ? p90 : null)}\n`;
    summary += `    - P95:               ${fmtMs(typeof p95 === 'number' ? p95 : null)}\n`;
  } else {
    summary += '    (metrica indisponivel)\n';
  }
  summary += '\n';

  const vu =
    vusMax && typeof vusMax === 'object' && typeof vusMax.max === 'number'
      ? vusMax.max
      : 'n/d';
  const iter =
    iters && typeof iters === 'object' && typeof iters.count === 'number'
      ? iters.count
      : 'n/d';
  summary += `  Usuarios Virtuais (max): ${vu}\n`;
  summary += `  Iteracoes:             ${iter}\n\n`;

  summary += '='.repeat(60) + '\n';

  return summary;
}
