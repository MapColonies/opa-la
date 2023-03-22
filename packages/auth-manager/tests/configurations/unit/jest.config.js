const base = require('../../../../../jest.config.base');

module.exports = {
  ...base,
  rootDir: '../../../.',
  displayName: 'auth-manager-unit',
  testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
  setupFiles: ['<rootDir>/tests/configurations/jest.setup.ts'],
  collectCoverageFrom: ['**/models/**/*Manager*.ts', '!<rootDir>/dist/**/*'],
  reporters: [
    'default',
    ['jest-html-reporters', { multipleReportsUnitePath: './reports', pageTitle: 'unit', publicPath: './reports', filename: 'unit.html' }],
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
