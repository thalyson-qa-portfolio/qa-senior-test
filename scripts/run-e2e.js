'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const { generateReport } = require('./generate-cucumber-html-report');

const cwd = path.join(__dirname, '..');
const extraArgs = process.argv.slice(2);

// shell: false — com shell: true o espaço em --tags "not @known_issue" partia o argumento e @known_issue virava path de feature (ENOENT).
const result = spawnSync('npx', ['cucumber-js', ...extraArgs], {
  cwd,
  stdio: 'inherit',
  shell: false,
});

generateReport();

const code = result.status;
process.exit(code === null ? 1 : code);
