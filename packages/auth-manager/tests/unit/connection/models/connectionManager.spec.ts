import jsLogger from '@map-colonies/js-logger';
import { FindOptionsWhere } from 'typeorm';
import { ConnectionManager } from '../../../../src/connection/models/connectionManager';
import { ConnectionNotFoundError, ConnectionVersionMismatchError } from '../../../../src/connection/models/errors';
import { ConnectionRepository } from '../../../../src/connection/DAL/connectionRepository';
import { Environment } from '../../../../src/common/constants';
import { getFakeConnection } from '../../../utils/connection';
import { DomainRepository } from '../../../../src/domain/DAL/domainRepository';
import { Connection, ConnectionSearchParams } from '../../../../src/connection/models/connection';
import { ClientNotFoundError } from '../../../../src/client/models/errors';
import { DomainNotFoundError } from '../../../../src/domain/models/errors';

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  const mockedConnectionRepository = {
    find: jest.fn<ReturnType<ConnectionRepository['find']>, Parameters<ConnectionRepository['find']>>(),
    findOne: jest.fn(),
    transaction: jest.fn(),
  };
  const mockedDomainRepository = {};
  beforeEach(function () {
    connectionManager = new ConnectionManager(
      jsLogger({ enabled: false }),
      mockedConnectionRepository as unknown as ConnectionRepository,
      mockedDomainRepository as DomainRepository
    );
    jest.resetAllMocks();
  });
  describe('#getConnections', () => {
    it('should return the array of connections', async function () {
      const connection = getFakeConnection();
      mockedConnectionRepository.find.mockResolvedValue([connection]);

      const connectionPromise = connectionManager.getConnections({});

      await expect(connectionPromise).resolves.toStrictEqual([connection]);
    });

    it.each([
      ['environment', [Environment.NP], 'environment'],
      ['isNoBrowser', true, 'allowNoBrowserConnection'],
      ['isNoOrigin', true, 'allowNoOriginConnection'],
      ['domains', ['avi'], 'domains'],
      ['isEnabled', true, 'enabled'],
    ] as [keyof ConnectionSearchParams, unknown, keyof FindOptionsWhere<Connection>][])(
      'should set the value of the param %s',
      async (inputName, inputValue, filterProperty) => {
        await connectionManager.getConnections({ [inputName]: inputValue });

        const call = mockedConnectionRepository.find.mock.calls[0][0];
        expect(call?.where).toHaveProperty(filterProperty);
      }
    );

    it('should throw an error if one is thrown by the repository', async function () {
      mockedConnectionRepository.find.mockRejectedValue(new Error());

      const connectionPromise = connectionManager.getConnections({});

      await expect(connectionPromise).rejects.toThrow();
    });
  });

  describe('#getConnection', () => {
    it('should return the connection', async function () {
      const connection = getFakeConnection();
      mockedConnectionRepository.findOne.mockResolvedValue(connection);

      const connectionPromise = connectionManager.getConnection('avi', Environment.STAGE, 1);

      await expect(connectionPromise).resolves.toStrictEqual(connection);
    });

    it('should throw an error if one is thrown by the repository', async function () {
      mockedConnectionRepository.findOne.mockRejectedValue(new Error());

      const connectionPromise = connectionManager.getConnection('avi', Environment.STAGE, 1);

      await expect(connectionPromise).rejects.toThrow();
    });

    it("should throw an error if the connection doesn't exists", async function () {
      mockedConnectionRepository.findOne.mockResolvedValue(null);

      const connectionPromise = connectionManager.getConnection('avi', Environment.STAGE, 1);

      await expect(connectionPromise).rejects.toThrow(ConnectionNotFoundError);
    });
  });
  describe('#upsertConnection', () => {
    let manager: ConnectionManager;
    const connectionTransactionRepo = {
      getMaxVersionWithLock: jest.fn(),
      save: jest.fn(),
    };
    const domainTransactionRepo = {
      checkInputForNonExistingDomains: jest.fn(),
    };
    const clientTransactionRepo = {
      findOneBy: jest.fn(),
    };
    beforeEach(function () {
      jest.resetAllMocks();
      clientTransactionRepo.findOneBy.mockResolvedValue({});
      domainTransactionRepo.checkInputForNonExistingDomains.mockResolvedValue([]);
      const connectionRepo = { manager: { transaction: jest.fn() } };
      const domainRepo = {};
      connectionRepo.manager.transaction.mockImplementation(async (fn: (a: unknown) => Promise<unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return fn({
          withRepository: jest
            .fn()
            .mockImplementation((callValue) => (callValue === connectionRepo ? connectionTransactionRepo : domainTransactionRepo)),
          getRepository: jest.fn().mockReturnValue(clientTransactionRepo),
        });
      });

      manager = new ConnectionManager(
        jsLogger({ enabled: false }),
        connectionRepo as unknown as ConnectionRepository,
        domainRepo as DomainRepository
      );
    });

    it("should insert the connection and return it if it doesn't exist in the database", async () => {
      const connection = getFakeConnection();
      connectionTransactionRepo.getMaxVersionWithLock.mockResolvedValue(null);
      connectionTransactionRepo.save.mockResolvedValue(connection);

      const connectionPromise = manager.upsertConnection(connection);

      await expect(connectionPromise).resolves.toStrictEqual(connection);
      expect(connectionTransactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(connectionTransactionRepo.save).toHaveBeenCalledTimes(1);
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

    it('should throw an error if a client with the given name do not exist', async () => {
      const connection = getFakeConnection();
      clientTransactionRepo.findOneBy.mockResolvedValue(null);

      const connectionPromise = manager.upsertConnection({ ...connection, version: 2 });

      await expect(connectionPromise).rejects.toThrow(ClientNotFoundError);
      expect(connectionTransactionRepo.save).not.toHaveBeenCalled();
    });

    it("should throw an error if a domain list contains a domain that doesn't exist", async () => {
      const connection = getFakeConnection();
      domainTransactionRepo.checkInputForNonExistingDomains.mockResolvedValue(['avi']);

      const connectionPromise = manager.upsertConnection({ ...connection, version: 2 });

      await expect(connectionPromise).rejects.toThrow(DomainNotFoundError);
      expect(connectionTransactionRepo.save).not.toHaveBeenCalled();
    });

    it("should throw an error if a connection doesn't exist and the version supplied is not 1", async () => {
      const connection = getFakeConnection();
      connectionTransactionRepo.getMaxVersionWithLock.mockResolvedValue(null);

      const connectionPromise = manager.upsertConnection({ ...connection, version: 2 });

      await expect(connectionPromise).rejects.toThrow(ConnectionVersionMismatchError);
      expect(connectionTransactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(connectionTransactionRepo.save).not.toHaveBeenCalled();
    });

    it("should throw an error if a connection exist but the supplied version doesn't match database version", async () => {
      const connection = getFakeConnection();
      connectionTransactionRepo.getMaxVersionWithLock.mockResolvedValue(1);

      const connectionPromise = manager.upsertConnection({ ...connection, version: 2 });

      await expect(connectionPromise).rejects.toThrow(ConnectionVersionMismatchError);
      expect(connectionTransactionRepo.getMaxVersionWithLock).toHaveBeenCalledTimes(1);
      expect(connectionTransactionRepo.save).not.toHaveBeenCalled();
    });
  });
});
