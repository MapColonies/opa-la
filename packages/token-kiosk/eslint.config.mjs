import { config } from '@map-colonies/eslint-config/helpers';
import baseConfig from '../../eslint.config.mjs';

export default config(baseConfig, { ignores: ['vitest.config.mts', 'ui/**/*'] });
