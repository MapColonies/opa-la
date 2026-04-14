import { defineConfig, ViteUserConfig } from 'vitest/config';
import { reporters, getPathAlias } from '@map-colonies/vitest-utils';
import tsconfig from './tsconfig.json';

export default defineConfig({
  resolve: {
    alias: getPathAlias(tsconfig, __dirname),
  },
  test: {
    globalSetup: './tests/configurations/vitest.globalSetup.ts',
    setupFiles: ['./tests/configurations/vitest.setup.ts'],
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
