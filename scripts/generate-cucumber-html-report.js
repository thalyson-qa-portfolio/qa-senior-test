'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function generateReport() {
  const root = path.join(__dirname, '..');
  const jsonDir = path.join(root, 'test-output', 'reports');
  const reportPath = path.join(root, 'test-output', 'cucumber-html-report');
  const jsonFile = path.join(jsonDir, 'cucumber-results.json');

  if (!fs.existsSync(jsonFile)) {
    console.warn('[report:e2e] Ignorado: arquivo inexistente:', jsonFile);
    return;
  }
  const raw = fs.readFileSync(jsonFile, 'utf8').trim();
  if (!raw) {
    console.warn('[report:e2e] Ignorado: JSON vazio');
    return;
  }

  fs.mkdirSync(reportPath, { recursive: true });

  const report = require('multiple-cucumber-html-reporter');

  report.generate({
    jsonDir,
    reportPath,
    displayDuration: true,
    durationInMS: true,
    pageTitle: 'Cucumber Report',
    reportName: 'E2E — Automation Exercise',
    metadata: {
      browser: { name: 'Chromium', version: 'Playwright' },
      device: process.env.CI ? 'GitHub Actions' : 'Local',
      platform: { name: os.platform(), version: os.release() },
    },
    customData: {
      title: 'Execução',
      data: [
        { label: 'Node', value: process.version },
        { label: 'Ambiente', value: process.env.CI === 'true' ? 'CI' : 'Local' },
      ],
    },
  });

  console.log('[report:e2e] Dashboard:', path.join(reportPath, 'index.html'));
}

module.exports = { generateReport };

if (require.main === module) {
  generateReport();
}
