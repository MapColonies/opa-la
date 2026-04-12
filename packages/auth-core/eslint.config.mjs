import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import { defineConfig } from 'eslint/config';

export default defineConfig(tsBaseConfig, { ignores: ['drizzle.config.ts', 'vitest.config.mts', '**/migrations/**'] });
