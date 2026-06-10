import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { getFakeAsset } from 'test-utils';
import type { Drizzle } from '@map-colonies/auth-core';
import { AssetManager } from '@src/asset/models/assetManager.js';
import { AssetVersionMismatchError } from '@src/asset/models/errors.js';
import type { AssetRepository } from '@src/asset/DAL/assetRepository.js';

const logger = await jsLogger({ enabled: false });

describe('AssetManager', () => {
  describe('#upsertAsset', () => {
    let manager: AssetManager;
    const mockReturning = vi.fn();
    const mockWhere = vi.fn();
    const mockSet = vi.fn();
    const mockTx = {
      insert: vi.fn(),
      update: vi.fn(),
    };
    const assetRepository = {
      getMaxVersionWithLock: vi.fn(),
      getMaxVersion: vi.fn(),
    };
    const drizzle = {
      transaction: vi.fn(),
    };

    beforeEach(function () {
      vi.resetAllMocks();
      mockReturning.mockResolvedValue([]);
      mockWhere.mockReturnValue({ returning: mockReturning });
      mockSet.mockReturnValue({ where: mockWhere });
      mockTx.update.mockReturnValue({ set: mockSet });
      drizzle.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx));
      manager = new AssetManager(logger, assetRepository as unknown as AssetRepository, drizzle as unknown as Drizzle);
    });

    it('should update the asset,return it, and advance the version by 1 if it exist in the database and the version matches', async () => {
      const asset = getFakeAsset();
      asset.version = 2;
      assetRepository.getMaxVersionWithLock.mockResolvedValue(1);
      mockReturning.mockResolvedValue([asset]);

      const assetPromise = manager.upsertAsset({ ...asset, version: 1 });

      await expect(assetPromise).resolves.toStrictEqual(asset);
      expect(assetRepository.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(mockTx.update).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(asset);
    });

    it("should throw an error if a asset doesn't exist and the version supplied is not 1", async () => {
      const asset = getFakeAsset();
      assetRepository.getMaxVersionWithLock.mockResolvedValue(null);

      const assetPromise = manager.upsertAsset({ ...asset, version: 2 });

      await expect(assetPromise).rejects.toThrow(AssetVersionMismatchError);
      expect(assetRepository.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it("should throw an error if a asset exist but the supplied version doesn't match database version", async () => {
      const asset = getFakeAsset();
      assetRepository.getMaxVersionWithLock.mockResolvedValue(1);

      const assetPromise = manager.upsertAsset({ ...asset, version: 2 });

      await expect(assetPromise).rejects.toThrow(AssetVersionMismatchError);
      expect(assetRepository.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(mockTx.update).not.toHaveBeenCalled();
    });
  });
});
