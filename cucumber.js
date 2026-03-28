module.exports = {
  default: {
    require: ['steps/**/*.ts', 'support/**/*.ts'],
    requireModule: ['ts-node/register'],
    paths: ['features/**/*.feature'],
    format: ['progress', 'html:reports/cucumber-report.html'],
    timeout: 60000,
  },
};
