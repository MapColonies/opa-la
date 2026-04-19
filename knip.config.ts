import { KnipConfig } from 'knip';

type UnwrapConfig<T> = T extends (...args: any[]) => infer R // 1. Is it a function? Get the return type.
  ? UnwrapConfig<R> // 2. Recurse (in case it's () => Promise<config>)
  : T extends Promise<infer P> // 3. Is it a Promise? Get the resolved type.
    ? UnwrapConfig<P> // 4. Recurse
    : T;

type PackageConfig = Exclude<UnwrapConfig<KnipConfig>['workspaces'], undefined>[string];

const basePackageConfig: PackageConfig = {
  entry: ['src/index.ts'],
  vitest: { config: 'vitest.config.mts', entry: ['tests/**/*.spec.ts', 'tests/**/*.test-d.ts'] },
  typescript: {
    config: ['tsconfig.json', 'tsconfig.build.json'],
  },
};

const config: KnipConfig = {
  $schema: 'https://unpkg.com/knip@5/schema.json',
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },
  workspaces: {
    'packages/*': {
      ...basePackageConfig,
    },
    'packages/auth-core': {
      ...basePackageConfig,
      entry: ['src/index.ts', 'src/config.ts', 'dataSource.mjs', 'src/db/migrations/*'], // config.ts is used in a way that knip can't detect, so we need to add it as an entry point
    },
    'apps/*': {
      ...basePackageConfig,
    },
  },
};

export default config;
