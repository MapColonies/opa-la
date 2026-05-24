import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { DatabaseError } from 'pg';
import { getFakeClient } from 'test-utils';
import type { Drizzle } from '@map-colonies/auth-core';
import { ClientManager } from '@src/client/models/clientManager.js';
import { ClientAlreadyExistsError } from '@src/client/models/errors.js';
import { pgErrorCodes } from '@src/common/db/constants.js';

const logger = await jsLogger({ enabled: false });

describe('ClientManager', () => {
  let clientManager: ClientManager;
  const mockReturning = vi.fn();
  const mockValues = vi.fn();
  const drizzle = {
    insert: vi.fn(),
  };

  beforeEach(function () {
    vi.resetAllMocks();
    mockValues.mockReturnValue({ returning: mockReturning });
    drizzle.insert.mockReturnValue({ values: mockValues });
    clientManager = new ClientManager(logger, drizzle as unknown as Drizzle);
  });

  describe('#createClient', () => {
    it('should throw AlreadyExistsError if the client is already in', async function () {
      const client = getFakeClient(false);
      const dbError = new DatabaseError('avi', 5, 'error');
      dbError.code = pgErrorCodes.UNIQUE_VIOLATION;
      const drizzleError = new Error('query error');
      drizzleError.name = 'DrizzleQueryError';
      (drizzleError as Error & { cause: unknown }).cause = dbError;
      mockReturning.mockRejectedValue(drizzleError);

      const domainPromise = clientManager.createClient(client);

      await expect(domainPromise).rejects.toThrow(ClientAlreadyExistsError);
      expect(drizzle.insert).toHaveBeenCalled();
    });
  });
});
