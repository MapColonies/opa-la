import { KnipConfig } from 'knip';

type UnwrapConfig<T> = T extends (...args: any[]) => infer R // 1. Is it a function? Get the return type.
  ? UnwrapConfig<R> // 2. Recurse (in case it's () => Promise<config>)
  : T extends Promise<infer P> // 3. Is it a Promise? Get the resolved type.
    ? UnwrapConfig<P> // 4. Recurse
    : T;

type PackageConfig = Exclude<UnwrapConfig<KnipConfig>['workspaces'], undefined>[string];

const entry = ['src/index.ts', 'dataSource.{ts,mjs}', 'drizzle.config.mts', 'src/instrumentation.mts', 'src/main.tsx'];

const basePackageConfig: PackageConfig = {
  entry,
  vitest: { config: 'vitest.config.mts', entry: ['tests/**/*.spec.ts', 'tests/**/*.test-d.ts'] },
  typescript: {
    config: ['tsconfig.json', 'tsconfig.build.json'],
  },
  ignoreUnresolved: ['./instrumentation.mjs'],
};

const config: KnipConfig = {
  $schema: 'https://unpkg.com/knip@5/schema.json',
  ignoreIssues: {
    'apps/*/src/components/ui/**': ['exports'],
  },
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },
  workspaces: {
    'packages/auth-core': {
      ...basePackageConfig,
      entry: [...entry, 'src/config.ts', 'src/db/migrations/*'],
    },
    'packages/auth-bundler': {
      ...basePackageConfig,
      ignore: ['example/**'],
      ignoreBinaries: ['opa'],
    },
    'apps/token-kiosk': {
      ...basePackageConfig,
    },
    'apps/kiosk-ui': {
      ignore: ['src/types/**'],
    },
  },
};

export default config;
