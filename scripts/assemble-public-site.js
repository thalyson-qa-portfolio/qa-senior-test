#!/usr/bin/env node
/**
 * Monta a pasta public/ para GitHub Pages a partir dos diretórios extraídos dos artifacts.
 * Variáveis de ambiente obrigatórias:
 *   API_SRC  — pasta do relatório HTML Playwright (deve conter index.html)
 *   E2E_SRC  — pasta do dashboard Cucumber (deve conter index.html)
 *   K6_ROOT  — raiz do artifact k6 (k6-output.txt e test-output/k6/…)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) die(`assemble-public-site: diretório em falta: ${src}`);
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtNum(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

function metricPick(metrics, names, field) {
  for (const name of names) {
    const m = metrics[name];
    if (m && typeof m === 'object' && m[field] !== undefined && m[field] !== null) {
      return m[field];
    }
  }
  return null;
}

function collectThresholdFailures(metrics) {
  const issues = [];
  for (const [name, data] of Object.entries(metrics || {})) {
    if (!data || typeof data !== 'object' || !data.thresholds) continue;
    for (const [rule, ok] of Object.entries(data.thresholds)) {
      if (ok === false) issues.push({ metric: name, rule });
    }
  }
  return issues;
}

function buildPerformanceSummaryHtml(summary) {
  const metrics = summary.metrics || {};
  const reqs = metrics.http_reqs || {};
  const dur = metrics.http_req_duration || {};
  const failed = metrics.http_req_failed || {};
  const checks = metrics.checks || {};
  const iters = metrics.iterations || {};
  const vus = metrics.vus_max || metrics.vus || {};

  const p95 = metricPick(metrics, ['http_req_duration', 'http_req_duration{expected_response:true}'], 'p(95)');
  const avg = metricPick(metrics, ['http_req_duration', 'http_req_duration{expected_response:true}'], 'avg');

  const checkPasses = checks.passes;
  const checkFails = checks.fails;
  let checksLine = '—';
  if (checkPasses != null || checkFails != null) {
    const p = checkPasses ?? 0;
    const f = checkFails ?? 0;
    const total = p + f;
    const rate = total > 0 ? ((p / total) * 100).toFixed(1) : '—';
    checksLine =
      total > 0
        ? `${fmtNum(p, 0)} ok · ${fmtNum(f, 0)} falha(s) (${rate}% ok)`
        : '—';
  }

  const failRate = failed.value;
  const httpFailLine =
    failRate !== null && failRate !== undefined && !Number.isNaN(Number(failRate))
      ? `${fmtNum(Number(failRate) * 100, 2)}%`
      : '—';

  const rows = [
    ['Requisições HTTP', fmtNum(reqs.count, 0)],
    ['Taxa', reqs.rate != null ? `${fmtNum(reqs.rate, 2)} req/s` : '—'],
    ['Latência média', avg != null ? `${fmtNum(avg, 2)} ms` : '—'],
    ['Latência p95', p95 != null ? `${fmtNum(p95, 2)} ms` : '—'],
    ['Iterações', iters.count != null ? fmtNum(iters.count, 0) : '—'],
    ['VUs (pico)', vus.max != null ? fmtNum(vus.max, 0) : vus.value != null ? fmtNum(vus.value, 0) : '—'],
    ['Checks', checksLine],
    ['Taxa HTTP falha (k6)', httpFailLine],
  ];

  const tableRows = rows
    .map(
      ([k, v]) =>
        `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(String(v))}</td></tr>`,
    )
    .join('');

  const thr = collectThresholdFailures(metrics);
  let alertBlock = '';
  if (thr.length > 0) {
    const lis = thr.map((t) => `<li><code>${escapeHtml(t.metric)}</code>: ${escapeHtml(t.rule)}</li>`).join('');
    alertBlock = `<div class="alert" role="status"><strong>Thresholds não satisfeitos</strong><ul>${lis}</ul></div>`;
  }

  return { tableRows, alertBlock };
}

function generatePerformanceHtml(perfDest, summaryPath) {
  let rawText = '';
  try {
    rawText = fs.readFileSync(summaryPath, 'utf8');
  } catch (e) {
    die(`assemble-public-site: não foi possível ler ${summaryPath}: ${e.message}`);
  }
  let summary;
  let pretty = rawText;
  try {
    summary = JSON.parse(rawText);
    pretty = JSON.stringify(summary, null, 2);
  } catch {
    summary = null;
  }

  const hasResults = fs.existsSync(path.join(perfDest, 'k6-results.json'));
  const resultsLink = hasResults
    ? '<a href="./k6-results.json">k6-results.json</a>'
    : '<span>k6-results.json (indisponível)</span>';

  const built = summary ? buildPerformanceSummaryHtml(summary) : null;
  const summarySection = built
    ? `${built.alertBlock}
  <table class="summary">
    <tbody>${built.tableRows}</tbody>
  </table>`
    : '<p class="muted">Não foi possível gerar o resumo a partir do JSON.</p>';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Performance (K6)</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1f2328; }
    .links { font-size: 0.9375rem; margin-bottom: 1.5rem; }
    .summary { width: 100%; border-collapse: collapse; font-size: 0.9375rem; }
    .summary th { text-align: left; font-weight: 600; padding: 0.5rem 0.75rem 0.5rem 0; width: 42%; vertical-align: top; border-bottom: 1px solid #d8dee4; }
    .summary td { padding: 0.5rem 0; border-bottom: 1px solid #d8dee4; }
    .alert { background: #fff8c5; border: 1px solid #d4a72c; border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 1rem; }
    .alert ul { margin: 0.5rem 0 0 1.25rem; }
    .muted { color: #656d76; }
    details { margin-top: 1.75rem; }
    summary { cursor: pointer; font-weight: 600; color: #0969da; }
    pre { background: #f6f8fa; padding: 1rem; overflow: auto; font-size: 0.75rem; line-height: 1.4; border-radius: 6px; margin-top: 0.75rem; }
    a { color: #0969da; }
  </style>
</head>
<body>
  <h1>Performance (K6)</h1>
  <p class="links"><a href="./k6-output.txt">Log (stdout)</a> · <a href="./k6-summary.json">k6-summary.json</a> (completo) · ${resultsLink}</p>
  <h2>Resumo</h2>
  ${summarySection}
  <details>
    <summary>Mostrar JSON completo do resumo</summary>
    <pre>${escapeHtml(pretty)}</pre>
  </details>
</body>
</html>`;
  fs.writeFileSync(path.join(perfDest, 'index.html'), html, 'utf8');
}

function generateRootIndex(publicDir) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Relatórios de testes</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    ul { line-height: 1.8; }
    a { color: #0969da; }
  </style>
</head>
<body>
  <h1>Relatórios de testes</h1>
  <p>Este site reflete a <strong>última execução publicada</strong> a partir da branch <code>main</code> em que o fluxo de CI concluiu com sucesso e gerou esta versão. O conteúdo corresponde a essa execução e pode variar entre runs.</p>
  <ul>
    <li><a href="./api/index.html">API (Playwright)</a></li>
    <li><a href="./e2e/index.html">E2E (Cucumber)</a></li>
    <li><a href="./performance/index.html">Performance (K6)</a></li>
  </ul>
</body>
</html>`;
  fs.writeFileSync(path.join(publicDir, 'index.html'), html, 'utf8');
}

function resolveK6InnerDir(k6Root) {
  const candidates = [
    path.join(k6Root, 'test-output', 'k6'),
    path.join(k6Root, 'k6'),
    k6Root,
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'k6-summary.json'))) return dir;
  }
  die(`assemble-public-site: em falta k6-summary.json sob ${k6Root}.`);
}

function main() {
  const apiSrc = process.env.API_SRC;
  const e2eSrc = process.env.E2E_SRC;
  const k6Root = process.env.K6_ROOT;

  if (!apiSrc || !e2eSrc || !k6Root) {
    die(
      'assemble-public-site: defina API_SRC, E2E_SRC e K6_ROOT (caminhos absolutos para os conteúdos dos artifacts).',
    );
  }

  const apiIndex = path.join(apiSrc, 'index.html');
  const e2eIndex = path.join(e2eSrc, 'index.html');
  if (!fs.existsSync(apiIndex)) die(`assemble-public-site: em falta ${apiIndex}`);
  if (!fs.existsSync(e2eIndex)) die(`assemble-public-site: em falta ${e2eIndex}`);

  const k6Inner = resolveK6InnerDir(k6Root);

  fs.rmSync(PUBLIC, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC, { recursive: true });

  copyDirSync(apiSrc, path.join(PUBLIC, 'api'));
  copyDirSync(e2eSrc, path.join(PUBLIC, 'e2e'));

  const perfDest = path.join(PUBLIC, 'performance');
  fs.mkdirSync(perfDest, { recursive: true });
  copyDirSync(k6Inner, perfDest);

  const k6Out = path.join(k6Root, 'k6-output.txt');
  if (fs.existsSync(k6Out)) {
    fs.copyFileSync(k6Out, path.join(perfDest, 'k6-output.txt'));
  }

  generatePerformanceHtml(perfDest, path.join(perfDest, 'k6-summary.json'));
  generateRootIndex(PUBLIC);

  console.log('assemble-public-site: concluído ->', PUBLIC);
}

main();
