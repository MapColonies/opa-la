import { Environment } from '@map-colonies/auth-core';
import { jsLogger } from '@map-colonies/js-logger';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { initConfig } from '@src/config.js';
import { validateS3 } from '@src/validators.js';

vi.mock('../src/telemetry/logger', async () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    logger: await jsLogger({ enabled: false }),
  };
});

describe('validators.ts', function () {
  beforeAll(async function () {
    await initConfig(true);
  });

  describe('#validateS3', function () {
    it('should not throw if the bucket exists', async function () {
      const promise = validateS3([Environment.NP]);

      await expect(promise).resolves.not.toThrow();
    });

    it('should throw if the bucket does not exists', async function () {
      const promise = validateS3([Environment.PROD]);

      await expect(promise).rejects.toThrow();
    });
  });
});
