const base = require('../../../../jest.config.base');

module.exports = {
  ...base,
  rootDir: '../../.',
  transform: {},
  displayName: 'auth-cron',
  moduleDirectories: ['node_modules'],
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  setupFiles: ['<rootDir>/tests/configurations/jest.setup.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
  globalSetup: '<rootDir>/tests/configurations/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/tests/configurations/jest.globalTeardown.ts',
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!**/*.d.ts', '!src/telemetry/**/*.ts'],
  reporters: [
    'default',
    ['jest-html-reporters', { multipleReportsUnitePath: './reports', pageTitle: 'tests', publicPath: './reports', filename: 'tests.html' }],
  ],
};
