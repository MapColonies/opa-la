import { isConfigError } from '@map-colonies/config';
import { getConfig } from '@src/config';

describe('config.ts', function () {
  describe('#getConfig', function () {
    it('should throw if the config is not initialized', function () {
      expect(() => getConfig()).toThrow();
    });

    it('should throw if no cron is configured', async function () {
      expect.assertions(2);
      await jest.isolateModulesAsync(async () => {
        /* eslint-disable @typescript-eslint/no-require-imports */
        const { initConfig } = require('../src/config') as typeof import('../src/config');
        const configModule = require('@map-colonies/config') as typeof import('@map-colonies/config');
        /* eslint-enable @typescript-eslint/no-require-imports */

        const configSpy = jest.spyOn(configModule, 'config');
        configSpy.mockImplementationOnce(async (params) => {
          params.localConfigPath = './tests/mocks/bad_test_config';
          return configModule.config(params);
        });

        const action = initConfig();
        await expect(action).rejects.toThrow('Config validation error');
        await action.catch((err) => {
          if (isConfigError(err, 'configValidationError')) {
            const filtered = err.payload?.filter((error) => error.message === "property 'cron' must match a schema in anyOf");
            // eslint-disable-next-line jest/no-conditional-expect
            expect(filtered).toHaveLength(1);
          }
        });
      });
    });
  });
});
