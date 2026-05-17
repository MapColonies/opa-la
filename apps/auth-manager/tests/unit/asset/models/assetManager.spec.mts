import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { getFakeAsset } from 'test-utils';
import { AssetManager } from '@src/asset/models/assetManager.js';
import { AssetVersionMismatchError } from '@src/asset/models/errors.js';
import type { AssetRepository } from '@src/asset/DAL/assetRepository.js';

const logger = await jsLogger({ enabled: false });

describe('AssetManager', () => {
  let assetManager: AssetManager;
  const mockedRepository = {
    findBy: vi.fn(),
    findOne: vi.fn(),
    transaction: vi.fn(),
  };

  beforeEach(function () {
    assetManager = new AssetManager(logger, mockedRepository as unknown as AssetRepository);
    vi.resetAllMocks();
  });

  describe('#upsertAsset', () => {
    let manager: AssetManager;
    const transactionRepo = {
      getMaxVersionWithLock: vi.fn(),
      save: vi.fn(),
    };

    beforeEach(function () {
      vi.resetAllMocks();
      const repo = { manager: { transaction: vi.fn() } };
      repo.manager.transaction.mockImplementation(async (fn: (a: unknown) => Promise<unknown>) => {
        return fn({ withRepository: vi.fn().mockReturnValue(transactionRepo) });
      });

      manager = new AssetManager(logger, repo as unknown as AssetRepository);
    });

    it('should update the asset,return it, and advance the version by 1 if it exist in the database and the version matches', async () => {
      const asset = getFakeAsset();
      asset.version = 2;
      transactionRepo.getMaxVersionWithLock.mockResolvedValue(1);
      transactionRepo.save.mockResolvedValue(asset);

      const assetPromise = manager.upsertAsset({ ...asset, version: 1 });

      await expect(assetPromise).resolves.toStrictEqual(asset);
      expect(transactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).toHaveBeenCalledWith(asset);
    });

    it("should throw an error if a asset doesn't exist and the version supplied is not 1", async () => {
      const asset = getFakeAsset();
      transactionRepo.getMaxVersionWithLock.mockResolvedValue(null);

      const assetPromise = manager.upsertAsset({ ...asset, version: 2 });

      await expect(assetPromise).rejects.toThrow(AssetVersionMismatchError);
      expect(transactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).not.toHaveBeenCalled();
    });

    it("should throw an error if a asset exist but the supplied version doesn't match database version", async () => {
      const asset = getFakeAsset();
      transactionRepo.getMaxVersionWithLock.mockResolvedValue(1);

      const assetPromise = manager.upsertAsset({ ...asset, version: 2 });

      await expect(assetPromise).rejects.toThrow(AssetVersionMismatchError);
      expect(transactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).not.toHaveBeenCalled();
    });
  });
});
