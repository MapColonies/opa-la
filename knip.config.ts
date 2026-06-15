import { KnipConfig } from 'knip';

const config: KnipConfig = {
  $schema: 'https://unpkg.com/knip@6/schema.json',
  ignoreIssues: {
    'apps/*/src/components/ui/**': ['exports'],
  },
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },
  ignoreBinaries: ['helm'],
  ignoreFiles: ['example/**'],
  ignoreDependencies: ['@map-colonies/infra-copilot-instructions', '@vitest/eslint-plugin'],
  workspaces: {
    'packages/auth-core': {
      entry: ['src/config.ts'],
      ignoreFiles: ['drizzle.config.mts'],
    },
    'packages/auth-bundler': {
      ignore: ['example/**'],
      ignoreBinaries: ['opa'],
    },
    'packages/test-utils': {},
    'apps/auth-manager': {
      ignoreUnresolved: ['./instrumentation.mjs'],
      ignoreDependencies: ['@types/lodash'],
      ignoreFiles: ['src/runMigrations.mts'],
      entry: ['src/instrumentation.mts'],
    },
    'apps/auth-cron': {
      ignoreUnresolved: ['./instrumentation.mjs'],
      entry: ['src/instrumentation.mts'],
    },
    'apps/token-kiosk': {
      ignoreUnresolved: ['./instrumentation.mjs'],
      ignoreFiles: ['src/runMigrations.mts'],
      entry: ['src/instrumentation.mts', 'drizzle.config.mts'],
    },
    'apps/kiosk-ui': {
      ignore: ['src/types/**'],
    },
    'apps/auth-ui': {},
  },
};

export default config;
