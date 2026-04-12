import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import vitestConfig from '@map-colonies/eslint-config/vitest';
import { defineConfig } from 'eslint/config';

export default defineConfig(tsBaseConfig, vitestConfig, { ignores: ['drizzle.config.ts', 'vitest.config.mts'] });
