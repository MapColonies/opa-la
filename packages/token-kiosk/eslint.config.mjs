import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import jestConfig from '@map-colonies/eslint-config/jest';
import { config } from '@map-colonies/eslint-config/helpers';

export default config(jestConfig, tsBaseConfig, { ignores: ['vitest.config.mts'] });
