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
  ignoreBinaries: ['lerna'],
  ignoreFiles: ['example/**'],
  ignoreDependencies: ['@map-colonies/infra-copilot-instructions', '@vitest/eslint-plugin'],
  workspaces: {
    'packages/auth-core': {
      entry: ['src/config.ts', 'src/db/migrations/*', 'dataSource.{ts,mjs}'],
    },
    'packages/auth-bundler': {
      entry: ['dataSource.ts'],
      ignore: ['example/**'],
      ignoreBinaries: ['opa'],
    },
    'packages/test-utils': {},
    'apps/auth-manager': {
      ignoreUnresolved: ['./instrumentation.mjs'],
      ignoreDependencies: ['@types/lodash'],
      entry: ['src/instrumentation.mts', 'dataSource.mjs'],
    },
    'apps/auth-cron': {
      ignoreUnresolved: ['./instrumentation.mjs'],
      entry: ['src/instrumentation.mts', 'dataSource.mjs'],
    },
    'apps/token-kiosk': {
      ignoreUnresolved: ['./instrumentation.mjs'],
      entry: ['src/instrumentation.mts', 'drizzle.config.mts'],
    },
    'apps/kiosk-ui': {
      ignore: ['src/types/**'],
    },
    'apps/auth-ui': {
      ignore: ['src/types/**'],
    },
  },
};

export default config;
