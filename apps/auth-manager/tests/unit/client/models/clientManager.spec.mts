import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { DatabaseError } from 'pg';
import { QueryFailedError } from 'typeorm';
import { getFakeClient } from 'test-utils';
import type { ClientRepository } from '@src/client/DAL/clientRepository.js';
import { ClientManager } from '@src/client/models/clientManager.js';
import { ClientAlreadyExistsError, ClientNotFoundError } from '@src/client/models/errors.js';
import { PgErrorCodes } from '@src/common/db/constants.js';

const logger = await jsLogger({ enabled: false });

describe('ClientManager', () => {
  let clientManager: ClientManager;
  const mockedRepository = {
    findAndCount: vi.fn(),
    insert: vi.fn(),
    findOne: vi.fn(),
    updateAndReturn: vi.fn(),
  };

  beforeEach(function () {
    clientManager = new ClientManager(logger, mockedRepository as unknown as ClientRepository);
    vi.resetAllMocks();
  });

  describe('#createClient', () => {
    it('should throw AlreadyExistsError if the client is already in', async function () {
      const client = getFakeClient(false);
      const dbError = new DatabaseError('avi', 5, 'error');
      dbError.code = PgErrorCodes.UNIQUE_VIOLATION;
      mockedRepository.insert.mockRejectedValue(new QueryFailedError('avi', undefined, dbError));

      const domainPromise = clientManager.createClient(client);

      await expect(domainPromise).rejects.toThrow(ClientAlreadyExistsError);
      expect(mockedRepository.insert).toHaveBeenCalled();
    });
  });
});
