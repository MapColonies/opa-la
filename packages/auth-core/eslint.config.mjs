import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(tsBaseConfig, globalIgnores(['drizzle.config.ts', 'vitest.config.mts', '**/migrations/**']));
