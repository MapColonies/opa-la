import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(tsBaseConfig, globalIgnores(['drizzle.config.mts', 'vitest.config.mts', '**/migrations/**']));
