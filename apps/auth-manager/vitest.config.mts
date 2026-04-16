import { defineConfig } from 'vitest/config';
import tsconfig from './tsconfig.json';
import { getPathAlias, reporters } from '@map-colonies/vitest-utils';

const pathAlias = getPathAlias(tsconfig, __dirname);

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          setupFiles: ['./tests/configurations/vitest.setup.mts', '@map-colonies/vitest-utils/extended'],
          include: ['tests/unit/**/*.spec.ts'],
          environment: 'node',
        },
        resolve: {
          alias: pathAlias,
        },
      },
      {
        test: {
          name: 'integration',
          setupFiles: ['./tests/configurations/vitest.setup.mts', '@map-colonies/vitest-utils/extended'],
          include: ['tests/integration/**/*.spec.ts'],
          environment: 'node',
          globalSetup: './tests/configurations/vitest.globalSetup.ts',
          sequence: {
            concurrent: false,
          },
          fileParallelism: false,
          maxWorkers: 1,
        },
        resolve: {
          alias: pathAlias,
        },
      },
    ],
    reporters,
    coverage: {
      enabled: true,
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['**/vendor/**', 'node_modules/**'],
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
