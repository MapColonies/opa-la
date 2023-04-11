import jsLogger from '@map-colonies/js-logger';
import { Environment } from 'auth-core';
import { AssetManager } from '../../../../src/asset/models/assetManager';
import { AssetNotFoundError, AssetVersionMismatchError } from '../../../../src/asset/models/errors';
import { AssetRepository } from '../../../../src/asset/DAL/assetRepository';
import { getFakeAsset } from '../../../utils/asset';

describe('AssetManager', () => {
  let assetManager: AssetManager;
  const mockedRepository = {
    findBy: jest.fn(),
    findOne: jest.fn(),
    transaction: jest.fn(),
  };
  beforeEach(function () {
    assetManager = new AssetManager(jsLogger({ enabled: false }), mockedRepository as unknown as AssetRepository);
    jest.resetAllMocks();
  });
  describe('#getAssets', () => {
    it('should return the array of assets', async function () {
      const asset = getFakeAsset();
      mockedRepository.findBy.mockResolvedValue([asset]);

      const assetPromise = assetManager.getAssets({});

      await expect(assetPromise).resolves.toStrictEqual([asset]);
    });

    it('should throw an error if one is thrown by the repository', async function () {
      mockedRepository.findBy.mockRejectedValue(new Error());

      const assetPromise = assetManager.getAssets({});

      await expect(assetPromise).rejects.toThrow();
    });
  });
  describe('#getNamedAssets', () => {
    it('should return the array of assets', async function () {
      const asset = getFakeAsset();
      mockedRepository.findBy.mockResolvedValue([asset]);

      const assetPromise = assetManager.getNamedAssets('avi');

      await expect(assetPromise).resolves.toStrictEqual([asset]);
    });

    it('should throw an error if one is thrown by the repository', async function () {
      mockedRepository.findBy.mockRejectedValue(new Error());

      const assetPromise = assetManager.getNamedAssets('avi');

      await expect(assetPromise).rejects.toThrow();
    });
  });
  describe('#getAsset', () => {
    it('should return the asset', async function () {
      const asset = getFakeAsset();
      mockedRepository.findOne.mockResolvedValue(asset);

      const assetPromise = assetManager.getAsset(Environment.STAGE, 1);

      await expect(assetPromise).resolves.toStrictEqual(asset);
    });

    it('should throw an error if one is thrown by the repository', async function () {
      mockedRepository.findOne.mockRejectedValue(new Error());

      const assetPromise = assetManager.getAsset(Environment.STAGE, 1);

      await expect(assetPromise).rejects.toThrow();
    });

    it('should throw an error if the asset already exists', async function () {
      mockedRepository.findOne.mockResolvedValue(null);

      const assetPromise = assetManager.getAsset(Environment.STAGE, 1);

      await expect(assetPromise).rejects.toThrow(AssetNotFoundError);
    });
  });
  describe('#upsertAsset', () => {
    let manager: AssetManager;
    const transactionRepo = {
      getMaxVersionWithLock: jest.fn(),
      save: jest.fn(),
    };
    beforeEach(function () {
      jest.resetAllMocks();
      const repo = { manager: { transaction: jest.fn() } };
      repo.manager.transaction.mockImplementation(async (fn: (a: unknown) => Promise<unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return fn({ withRepository: jest.fn().mockReturnValue(transactionRepo) });
      });

      manager = new AssetManager(jsLogger({ enabled: false }), repo as unknown as AssetRepository);
    });

    it("should insert the asset and return it if it doesn't exist in the database", async () => {
      const asset = getFakeAsset();
      transactionRepo.getMaxVersionWithLock.mockResolvedValue(null);
      transactionRepo.save.mockResolvedValue(asset);

      const assetPromise = manager.upsertAsset(asset);

      await expect(assetPromise).resolves.toStrictEqual(asset);
      expect(transactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).toHaveBeenCalledTimes(1);
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
