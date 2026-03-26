import jsLogger from '@map-colonies/js-logger';
import { DatabaseError } from 'pg';
import { QueryFailedError } from 'typeorm';
import { ClientRepository } from '../../../../src/client/DAL/clientRepository';
import { ClientManager } from '../../../../src/client/models/clientManager';
import { ClientAlreadyExistsError, ClientNotFoundError } from '../../../../src/client/models/errors';
import { PgErrorCodes } from '../../../../src/common/db/constants';
import { getFakeClient } from '../../../utils/client';

describe('ClientManager', () => {
  let clientManager: ClientManager;
  const mockedRepository = {
    findAndCount: jest.fn(),
    insert: jest.fn(),
    findOne: jest.fn(),
    updateAndReturn: jest.fn(),
  };
  beforeEach(function () {
    clientManager = new ClientManager(jsLogger({ enabled: false }), mockedRepository as unknown as ClientRepository);
    jest.resetAllMocks();
  });
  describe('#getClients', () => {
    it('should return the array of clients', async function () {
      const client = getFakeClient(true);
      mockedRepository.findAndCount.mockResolvedValue([[client], 1]);

      const domainPromise = clientManager.getClients({});

      await expect(domainPromise).resolves.toStrictEqual([[client], 1]);
    });

    it('should throw an error if thrown by the ORM', async function () {
      mockedRepository.findAndCount.mockRejectedValue(new Error());

      const domainPromise = clientManager.getClients({});

      await expect(domainPromise).rejects.toThrow();
    });
  });

  describe('#getClient', () => {
    it('should return the client', async function () {
      const client = getFakeClient(true);
      mockedRepository.findOne.mockResolvedValue(client);

      const clientPromise = clientManager.getClient(client.name);

      await expect(clientPromise).resolves.toStrictEqual(client);
    });

    it('should throw an error if thrown by the ORM', async function () {
      mockedRepository.findOne.mockRejectedValue(new Error());

      const clientPromise = clientManager.getClient('avi');

      await expect(clientPromise).rejects.toThrow();
    });

    it('should return client not found error', async function () {
      mockedRepository.findOne.mockResolvedValue(null);

      const clientPromise = clientManager.getClient('avi');

      await expect(clientPromise).rejects.toThrow(ClientNotFoundError);
    });
  });
  describe('#createClient', () => {
    it('should insert into the db and return the client', async function () {
      const client = getFakeClient(false);
      mockedRepository.insert.mockResolvedValue(undefined);

      const domainPromise = clientManager.createClient(client);

      await expect(domainPromise).resolves.toStrictEqual(client);
      expect(mockedRepository.insert).toHaveBeenCalled();
    });

    it('should throw AlreadyExistsError if the client is already in', async function () {
      const client = getFakeClient(false);
      const dbError = new DatabaseError('avi', 5, 'error');
      dbError.code = PgErrorCodes.UNIQUE_VIOLATION;
      mockedRepository.insert.mockRejectedValue(new QueryFailedError('avi', undefined, dbError));

      const domainPromise = clientManager.createClient(client);

      await expect(domainPromise).rejects.toThrow(ClientAlreadyExistsError);
      expect(mockedRepository.insert).toHaveBeenCalled();
    });

    it('should throw an error if the db throws one', async function () {
      const client = getFakeClient(false);
      mockedRepository.insert.mockRejectedValue(new Error());

      const domainPromise = clientManager.createClient(client);

      await expect(domainPromise).rejects.toThrow();
      expect(mockedRepository.insert).toHaveBeenCalled();
    });
  });

  describe('#updateClient', () => {
    it('should update the db and return the client', async function () {
      const { name, ...client } = getFakeClient(false);
      mockedRepository.updateAndReturn.mockResolvedValue({ name, ...client });

      const domainPromise = clientManager.updateClient(name, client);

      await expect(domainPromise).resolves.toStrictEqual({ name, ...client });
      expect(mockedRepository.updateAndReturn).toHaveBeenCalled();
    });

    it('should throw ClientNotFoundError if the client is not found', async function () {
      const { name, ...client } = getFakeClient(false);
      mockedRepository.updateAndReturn.mockResolvedValue(null);

      const domainPromise = clientManager.updateClient(name, client);

      await expect(domainPromise).rejects.toThrow(ClientNotFoundError);
      expect(mockedRepository.updateAndReturn).toHaveBeenCalled();
    });

    it('should throw an error if the db throws one', async function () {
      const { name, ...client } = getFakeClient(false);
      mockedRepository.updateAndReturn.mockRejectedValue(new Error());

      const domainPromise = clientManager.updateClient(name, client);

      await expect(domainPromise).rejects.toThrow();
      expect(mockedRepository.updateAndReturn).toHaveBeenCalled();
    });
  });
});
