import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { getFakeConnection } from 'test-utils';
import type { Drizzle } from '@map-colonies/auth-core';
import { ConnectionManager } from '@src/connection/models/connectionManager.js';
import type { ConnectionRepository } from '@src/connection/DAL/connectionRepository.js';
import type { DomainRepository } from '@src/domain/DAL/domainRepository.js';
import type { KeyRepository } from '@src/key/DAL/keyRepository.js';

const logger = await jsLogger({ enabled: false });

describe('ConnectionManager', () => {
  describe('#upsertConnection', () => {
    let manager: ConnectionManager;
    const mockReturning = vi.fn();
    const mockValues = vi.fn();
    const mockTx = {
      insert: vi.fn(),
      query: {
        client: {
          findFirst: vi.fn(),
        },
      },
    };
    const connectionRepository = {
      getMaxVersionWithLock: vi.fn(),
      getMaxVersion: vi.fn(),
    };
    const domainRepository = {
      checkInputForNonExistingDomains: vi.fn(),
    };
    const keyRepository = {
      getLatestKeys: vi.fn(),
    };
    const drizzle = {
      transaction: vi.fn(),
    };

    beforeEach(function () {
      vi.resetAllMocks();
      mockTx.query.client.findFirst.mockResolvedValue({});
      domainRepository.checkInputForNonExistingDomains.mockResolvedValue([]);
      mockValues.mockReturnValue({ returning: mockReturning });
      mockTx.insert.mockReturnValue({ values: mockValues });
      drizzle.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx));

      manager = new ConnectionManager(
        logger,
        connectionRepository as unknown as ConnectionRepository,
        domainRepository as unknown as DomainRepository,
        keyRepository as unknown as KeyRepository,
        drizzle as unknown as Drizzle
      );
    });

    it('should update the connection,return it, and advance the version by 1 if it exist in the database and the version matches', async () => {
      const connection = getFakeConnection();
      connection.version = 2;
      connectionRepository.getMaxVersionWithLock.mockResolvedValue(1);
      mockReturning.mockResolvedValue([connection]);

      const connectionPromise = manager.upsertConnection({ ...connection, version: 1 });

      await expect(connectionPromise).resolves.toStrictEqual(connection);
      expect(connectionRepository.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(mockTx.insert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledWith(connection);
    });

    it('should return the connection with empty token if the token generation failed and ignoreTokenErrors is true', async () => {
      const connection = getFakeConnection();
      connection.token = '';
      connectionRepository.getMaxVersionWithLock.mockResolvedValue(1);
      mockReturning.mockResolvedValue([connection]);
      keyRepository.getLatestKeys = vi.fn().mockResolvedValue([{ environment: connection.environment, privateKey: 'avi' }]);

      const connectionRes = await manager.upsertConnection({ ...connection, version: 1 }, true);

      expect(connectionRes).toHaveProperty('token', '');
    });
  });
});
