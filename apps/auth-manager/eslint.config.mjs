import { defineConfig, globalIgnores } from 'eslint/config';
import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import vitestConfig from '@map-colonies/eslint-config/vitest';

export default defineConfig(tsBaseConfig, vitestConfig, globalIgnores(['vitest.config.mts', 'ui/**/*', 'drizzle.config.mts']));
