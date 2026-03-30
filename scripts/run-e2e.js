'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const { generateReport } = require('./generate-cucumber-html-report');

const cwd = path.join(__dirname, '..');
const extraArgs = process.argv.slice(2);

const result = spawnSync('npx', ['cucumber-js', ...extraArgs], {
  cwd,
  stdio: 'inherit',
  shell: true,
});

generateReport();

const code = result.status;
process.exit(code === null ? 1 : code);
