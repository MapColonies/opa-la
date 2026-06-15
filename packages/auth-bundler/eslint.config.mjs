import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import vitestConfig from '@map-colonies/eslint-config/vitest';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(tsBaseConfig, vitestConfig, globalIgnores(['drizzle.config.ts', 'vitest.config.mts', 'dataSource.ts']));
