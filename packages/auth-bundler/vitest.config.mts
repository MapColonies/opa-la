import { defineConfig, ViteUserConfig } from 'vitest/config';
import tsconfig from './tsconfig.json';
import { reporters, getPathAlias } from '@map-colonies/vitest-utils';

export default defineConfig({
  resolve: {
    alias: getPathAlias(tsconfig, __dirname),
  },
  test: {
    globalSetup: './tests/configurations/vitest.globalSetup.mts',
    setupFiles: ['@map-colonies/vitest-utils/extended'],
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    reporters,
    coverage: {
      enabled: true,
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['**/vendor/**', 'node_modules/**', 'src/common', 'src/db', 'src/auth', 'src/index.ts'],
      reportOnFailure: true,
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
