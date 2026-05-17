import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { Environment } from '@map-colonies/auth-core';
import { getRealKeys, getFakeConnection } from 'test-utils';
import { ConnectionManager } from '@src/connection/models/connectionManager.js';
import { ConnectionNotFoundError, ConnectionVersionMismatchError } from '@src/connection/models/errors.js';
import type { ConnectionRepository } from '@src/connection/DAL/connectionRepository.js';
import type { DomainRepository } from '@src/domain/DAL/domainRepository.js';
import { ClientNotFoundError } from '@src/client/models/errors.js';
import { DomainNotFoundError } from '@src/domain/models/errors.js';
import type { KeyRepository } from '@src/key/DAL/keyRepository.js';
import { KeyNotFoundError } from '@src/key/models/errors.js';

const logger = await jsLogger({ enabled: false });

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  const mockedConnectionRepository = {
    findAndCount: vi.fn(),
    findOne: vi.fn(),
    transaction: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
  const mockedDomainRepository = {};
  const mockedKeysRepository = {};

  beforeEach(function () {
    connectionManager = new ConnectionManager(
      logger,
      mockedConnectionRepository as unknown as ConnectionRepository,
      mockedDomainRepository as DomainRepository,
      mockedKeysRepository as KeyRepository
    );
    vi.resetAllMocks();
  });

  describe('#upsertConnection', () => {
    let manager: ConnectionManager;
    const connectionTransactionRepo = {
      getMaxVersionWithLock: vi.fn(),
      save: vi.fn(),
    };
    const domainTransactionRepo = {
      checkInputForNonExistingDomains: vi.fn(),
    };
    const clientTransactionRepo = {
      findOneBy: vi.fn(),
    };
    const keyTransactionRepo = {
      getLatestKeys: vi.fn(),
    };

    beforeEach(function () {
      vi.resetAllMocks();
      clientTransactionRepo.findOneBy.mockResolvedValue({});
      domainTransactionRepo.checkInputForNonExistingDomains.mockResolvedValue([]);
      const connectionRepo = { manager: { transaction: vi.fn() } };
      const domainRepo = {};
      const keysRepo = {};
      connectionRepo.manager.transaction.mockImplementation(async (fn: (a: unknown) => Promise<unknown>) => {
        return fn({
          withRepository: vi.fn().mockImplementation((callValue) => {
            switch (callValue) {
              case connectionRepo:
                return connectionTransactionRepo;
              case domainRepo:
                return domainTransactionRepo;
              case keysRepo:
                return keyTransactionRepo;
              default:
                throw new Error('unknown repo');
            }
          }),
          getRepository: vi.fn().mockReturnValue(clientTransactionRepo),
        });
      });

      manager = new ConnectionManager(
        logger,
        connectionRepo as unknown as ConnectionRepository,
        domainRepo as DomainRepository,
        keysRepo as KeyRepository
      );
    });

    it('should update the connection,return it, and advance the version by 1 if it exist in the database and the version matches', async () => {
      const connection = getFakeConnection();
      connection.version = 2;
      connectionTransactionRepo.getMaxVersionWithLock.mockResolvedValue(1);
      connectionTransactionRepo.save.mockResolvedValue(connection);

      const connectionPromise = manager.upsertConnection({ ...connection, version: 1 });

      await expect(connectionPromise).resolves.toStrictEqual(connection);
      expect(connectionTransactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(connectionTransactionRepo.save).toHaveBeenCalledTimes(1);
      expect(connectionTransactionRepo.save).toHaveBeenCalledWith(connection);
    });

    it('should return the connection with empty token if the token generation failed and ignoreTokenErrors is true', async () => {
      const connection = getFakeConnection();
      connection.token = '';
      connectionTransactionRepo.getMaxVersionWithLock.mockResolvedValue(1);
      connectionTransactionRepo.save.mockResolvedValue(connection);
      keyTransactionRepo.getLatestKeys = vi.fn().mockResolvedValue([{ environment: connection.environment, privateKey: 'avi' }]);

      const connectionRes = await manager.upsertConnection({ ...connection, version: 1 }, true);

      expect(connectionRes).toHaveProperty('token', '');
    });
  });
});
