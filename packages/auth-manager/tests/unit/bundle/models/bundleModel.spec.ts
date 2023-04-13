import jsLogger from '@map-colonies/js-logger';
import { Bundle } from '@map-colonies/auth-core';
import { Repository } from 'typeorm';
import { BundleManager } from '../../../../src/bundle/models/bundleManager';
import { BundleNotFoundError } from '../../../../src/bundle/models/errors';
import { getFakeBundle } from '../../../utils/bundle';

describe('BundleManager', () => {
  let bundleManager: BundleManager;
  const mockedRepository = {
    findBy: jest.fn(),
    findOneBy: jest.fn(),
  };
  beforeEach(function () {
    bundleManager = new BundleManager(jsLogger({ enabled: false }), mockedRepository as unknown as Repository<Bundle>);
    jest.resetAllMocks();
  });
  describe('#getBundles', () => {
    it('should return the array of bundles', async function () {
      const bundle = getFakeBundle();
      mockedRepository.findBy.mockResolvedValue([bundle]);

      const bundlePromise = bundleManager.getBundles({});

      await expect(bundlePromise).resolves.toStrictEqual([bundle]);
    });

    it('should throw an error if thrown by the ORM', async function () {
      mockedRepository.findBy.mockRejectedValue(new Error());

      const bundlePromise = bundleManager.getBundles({});

      await expect(bundlePromise).rejects.toThrow();
    });
  });
  describe('#getBundle', () => {
    it('should return the bundle', async function () {
      const bundle = getFakeBundle();
      mockedRepository.findOneBy.mockResolvedValue(bundle);

      const bundlePromise = bundleManager.getBundle(1);

      await expect(bundlePromise).resolves.toStrictEqual(bundle);
    });

    it('should throw NotFoundError if the bundle is not in the db', async function () {
      mockedRepository.findOneBy.mockResolvedValue(null);

      const bundlePromise = bundleManager.getBundle(1);

      await expect(bundlePromise).rejects.toThrow(BundleNotFoundError);
    });

    it('should throw an error if the db throws one', async function () {
      mockedRepository.findOneBy.mockRejectedValue(new Error());

      const bundlePromise = bundleManager.getBundle(1);

      await expect(bundlePromise).rejects.toThrow();
    });
  });
});
