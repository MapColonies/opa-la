import { vi, describe, it, expect } from 'vitest';
import { ConfigErrors } from '@map-colonies/config';
import { getConfig } from '@src/config';

describe('config.ts', function () {
  describe('#getConfig', function () {
    it('should throw if the config is not initialized', function () {
      expect(() => getConfig()).toThrow();
    });

    it('should throw if no cron is configured', async function () {
      expect.assertions(2);
      vi.resetModules();
      // await vi.isolateModulesAsync(async () => {
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { initConfig } = (await import('../src/config.js')) as typeof import('../src/config');
      const configModule = require('@map-colonies/config') as typeof import('@map-colonies/config');
      /* eslint-enable @typescript-eslint/no-require-imports */

      const configSpy = vi.spyOn(configModule, 'config');
      configSpy.mockImplementationOnce(async (params) => {
        params.localConfigPath = './tests/mocks/bad_test_config';
        return configModule.config(params);
      });

      const action = initConfig(true);
      await expect(action).rejects.toThrow('Config validation error');
      await action.catch((err) => {
        const validationErr = err as ConfigErrors['configValidationError'];

        const filtered = validationErr.payload.filter((error) => error.message === "property 'cron' must match a schema in anyOf");
        expect(filtered).toHaveLength(1);
        // });
      });
    });
  });
});
