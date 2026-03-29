module.exports = {
  default: {
    require: ['e2e/steps/**/*.ts', 'e2e/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    paths: ['e2e/features/**/*.feature'],
    format: [
      'progress',
      'html:test-output/reports/cucumber-report.html',
      'json:test-output/reports/cucumber-results.json',
    ],
    timeout: 60000,
  },
};
