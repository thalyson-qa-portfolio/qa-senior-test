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

function generatePerformanceHtml(perfDest, summaryPath) {
  let rawText = '';
  try {
    rawText = fs.readFileSync(summaryPath, 'utf8');
  } catch (e) {
    die(`assemble-public-site: não foi possível ler ${summaryPath}: ${e.message}`);
  }
  let pretty = rawText;
  try {
    pretty = JSON.stringify(JSON.parse(rawText), null, 2);
  } catch {
    pretty = rawText;
  }
  const hasResults = fs.existsSync(path.join(perfDest, 'k6-results.json'));
  const resultsLink = hasResults
    ? '<a href="./k6-results.json">k6-results.json</a>'
    : '<span>k6-results.json (indisponível)</span>';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Performance (K6)</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; }
    pre { background: #f5f5f5; padding: 1rem; overflow: auto; font-size: 0.8125rem; }
    a { color: #0969da; }
  </style>
</head>
<body>
  <h1>Performance (K6)</h1>
  <p>Resumo (<code>k6-summary.json</code>). <a href="./k6-output.txt">stdout (log)</a> · ${resultsLink}</p>
  <h2>k6-summary.json</h2>
  <pre>${escapeHtml(pretty)}</pre>
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

  const k6Inner = path.join(k6Root, 'test-output', 'k6');
  const summaryPath = path.join(k6Inner, 'k6-summary.json');
  if (!fs.existsSync(summaryPath)) die(`assemble-public-site: em falta ${summaryPath}`);

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
