import jsLogger from '@map-colonies/js-logger';
import { KeyManager } from '../../../../src/key/models/keyManager';
import { KeyNotFoundError, KeyVersionMismatchError } from '../../../../src/key/models/errors';
import { KeyRepository } from '../../../../src/key/DAL/keyRepository';
import { Environment } from '../../../../src/common/constants';

describe('KeyManager', () => {
  let keyManager: KeyManager;
  const mockedRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    getLatestKeys: jest.fn(),
    transaction: jest.fn(),
  };
  beforeEach(function () {
    keyManager = new KeyManager(jsLogger({ enabled: false }), mockedRepository as unknown as KeyRepository);
    jest.resetAllMocks();
  });
  describe('#getLatestKeys', () => {
    it('should return the array of keys', async function () {
      mockedRepository.getLatestKeys.mockResolvedValue([{ version: 1, environment: Environment.STAGE }]);

      const keyPromise = keyManager.getLatestKeys();

      await expect(keyPromise).resolves.toStrictEqual([{ version: 1, environment: Environment.STAGE }]);
    });

    it('should throw an error if one is thrown by the repository', async function () {
      mockedRepository.getLatestKeys.mockRejectedValue(new Error());

      const keyPromise = keyManager.getLatestKeys();

      await expect(keyPromise).rejects.toThrow();
    });
  });
  describe('#getEnvKeys', () => {
    it('should return the array of keys', async function () {
      mockedRepository.find.mockResolvedValue([{ version: 1, environment: Environment.STAGE }]);

      const keyPromise = keyManager.getEnvKeys(Environment.STAGE);

      await expect(keyPromise).resolves.toStrictEqual([{ version: 1, environment: Environment.STAGE }]);
    });

    it('should throw an error if one is thrown by the repository', async function () {
      mockedRepository.find.mockRejectedValue(new Error());

      const keyPromise = keyManager.getEnvKeys(Environment.STAGE);

      await expect(keyPromise).rejects.toThrow();
    });
  });
  describe('#getKey', () => {
    it('should return the key', async function () {
      mockedRepository.findOne.mockResolvedValue({ version: 1, environment: Environment.STAGE });

      const keyPromise = keyManager.getKey(Environment.STAGE, 1);

      await expect(keyPromise).resolves.toStrictEqual({ version: 1, environment: Environment.STAGE });
    });

    it('should throw an error if one is thrown by the repository', async function () {
      mockedRepository.findOne.mockRejectedValue(new Error());

      const keyPromise = keyManager.getKey(Environment.STAGE, 1);

      await expect(keyPromise).rejects.toThrow();
    });

    it('should throw an error if the key already exists', async function () {
      mockedRepository.findOne.mockResolvedValue(null);

      const keyPromise = keyManager.getKey(Environment.STAGE, 1);

      await expect(keyPromise).rejects.toThrow(KeyNotFoundError);
    });
  });
  describe('#upsertKey', () => {
    let manager: KeyManager;
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

      manager = new KeyManager(jsLogger({ enabled: false }), repo as unknown as KeyRepository);
    });

    it("should insert the key and return it if it doesn't exist in the database", async () => {
      transactionRepo.getMaxVersionWithLock.mockResolvedValue(null);
      transactionRepo.save.mockResolvedValue({ version: 1, environment: Environment.PRODUCTION });

      const keyPromise = manager.upsertKey({ version: 1, environment: Environment.PRODUCTION });

      await expect(keyPromise).resolves.toStrictEqual({ version: 1, environment: Environment.PRODUCTION });
      expect(transactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should update the key,return it, and advance the version by 1 if it exist in the database and the version matches', async () => {
      transactionRepo.getMaxVersionWithLock.mockResolvedValue(1);
      transactionRepo.save.mockResolvedValue({ version: 2, environment: Environment.PRODUCTION });

      const keyPromise = manager.upsertKey({ version: 1, environment: Environment.PRODUCTION });

      await expect(keyPromise).resolves.toStrictEqual({ version: 2, environment: Environment.PRODUCTION });
      expect(transactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).toHaveBeenCalledWith({ version: 2, environment: Environment.PRODUCTION });
    });

    it("should throw an error if a key doesn't exist and the version supplied is not 1", async () => {
      transactionRepo.getMaxVersionWithLock.mockResolvedValue(null);

      const keyPromise = manager.upsertKey({ version: 2, environment: Environment.PRODUCTION });

      await expect(keyPromise).rejects.toThrow(KeyVersionMismatchError);
      expect(transactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).not.toHaveBeenCalled();
    });

    it("should throw an error if a key exist but the supplied version doesn't match database version", async () => {
      transactionRepo.getMaxVersionWithLock.mockResolvedValue(1);

      const keyPromise = manager.upsertKey({ version: 2, environment: Environment.PRODUCTION });

      await expect(keyPromise).rejects.toThrow(KeyVersionMismatchError);
      expect(transactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(transactionRepo.save).not.toHaveBeenCalled();
    });
  });
});
