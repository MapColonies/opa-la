import { Environment } from '@map-colonies/auth-core';
import jsLogger from '@map-colonies/js-logger';
import { initConfig } from '@src/config';
import { validateS3 } from '@src/validators';

jest.mock('../src/telemetry/logger', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    logger: jsLogger({ enabled: false }),
  };
});

describe('validators.ts', function () {
  beforeAll(async function () {
    await initConfig();
  });
  describe('#validateS3', function () {
    it('should not throw if the bucket exists', async function () {
      const promise = validateS3([Environment.NP]);
      await expect(promise).resolves.not.toThrow();
    });

    it('should throw if the bucket does not exists', async function () {
      const promise = validateS3([Environment.PRODUCTION]);

      await expect(promise).rejects.toThrow();
    });
  });
});
