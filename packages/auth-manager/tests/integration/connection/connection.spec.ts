/// <reference types="jest-extended" />
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import 'jest-openapi';
import { DataSource } from 'typeorm';
import { Client, Connection, Domain, Environment, IConnection, Key } from '@map-colonies/auth-core';
import { faker } from '@faker-js/faker';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { ConnectionRepository } from '../../../src/connection/DAL/connectionRepository';
import { getFakeConnection, getFakeIConnection } from '../../utils/connection';
import { KeyRepository } from '../../../src/key/DAL/keyRepository';
import { DomainRepository } from '../../../src/domain/DAL/domainRepository';
import { getFakeClient } from '../../utils/client';
import { getRealKeys } from '../../utils/key';
import { initConfig } from '../../../src/common/config';
import { ConnectionRequestSender } from './helpers/requestSender';

describe('connection', function () {
  let requestSender: ConnectionRequestSender;
  let depContainer: DependencyContainer;
  const clients = [getFakeClient(false), getFakeClient(false)];
  const connections = [
    { ...getFakeIConnection(), name: clients[0].name, environment: Environment.NP, domains: ['test'] },
    { ...getFakeIConnection(), name: clients[0].name, environment: Environment.PRODUCTION },
    { ...getFakeIConnection(), name: clients[0].name, environment: Environment.PRODUCTION, version: 2 },
    { ...getFakeIConnection(), name: clients[1].name, environment: Environment.NP },
  ];

  beforeAll(async function () {
    await initConfig();
    const [app, container] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });
    requestSender = new ConnectionRequestSender(app);
    depContainer = container;
    await depContainer.resolve(DataSource).getRepository(Client).save(clients);
    await depContainer.resolve(DataSource).getRepository(Connection).save(connections);
    await depContainer
      .resolve(DataSource)
      .getRepository(Domain)
      .save([{ name: 'alpha' }, { name: 'bravo' }, { name: 'test' }]);
  });

  afterAll(async function () {
    await depContainer.resolve(DataSource).destroy();
  });

  describe('Happy Path', function () {
    describe('GET /connections', function () {
      it('should return 200 status code and all the connections', async function () {
        const res = await requestSender.getConnections();

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.length).toBeGreaterThan(0);
      });

      it('should return 200 status code and all the connections with specific env', async function () {
        const res = await requestSender.getConnections({ environment: [Environment.PRODUCTION] });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((c: IConnection) => c.environment.includes(Environment.PRODUCTION));
      });

      it('should return 200 status code and all the connections with specific domain', async function () {
        const res = await requestSender.getConnections({ domains: ['test'] });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((c: IConnection) => c.domains.includes('test'));
      });
    });

    describe('POST /connection', function () {
      it('should return 201 status code and the created connection', async function () {
        const client = getFakeClient(false);
        const connection = getFakeIConnection();
        connection.name = client.name;
        await depContainer.resolve(DataSource).getRepository(Client).save(client);

        const res = await requestSender.upsertConnection(connection);

        delete connection.createdAt;

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(connection);
        expect(res.body).toHaveProperty('token', connection.token);
      });

      it('should return 200 status code and the updated connection', async function () {
        const client = getFakeClient(false);
        const connection = getFakeIConnection();
        connection.name = client.name;
        await depContainer.resolve(DataSource).getRepository(Client).save(client);
        await depContainer.resolve(DataSource).getRepository(Connection).save(connection);

        delete connection.createdAt;

        const res = await requestSender.upsertConnection(connection);

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ ...connection, version: 2 });
      });

      it('should not generate a token and return an empty string if no token is supplied and no private key is available and ignoreErrors is true', async function () {
        const client = getFakeClient(false);
        const connection = getFakeIConnection();
        connection.name = client.name;
        connection.token = '';
        await depContainer.resolve(DataSource).getRepository(Client).save(client);

        const res = await requestSender.upsertConnection(connection, true);
        delete connection.createdAt;

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toHaveProperty('token', '');
      });

      it('should generate a token if no token is supplied and private key is available', async function () {
        const client = getFakeClient(false);
        const connection = getFakeIConnection();
        const keys = getRealKeys();
        connection.name = client.name;
        connection.environment = Environment.STAGE;
        await depContainer.resolve(DataSource).getRepository(Client).save(client);
        await depContainer.resolve(DataSource).getRepository(Connection).save(connection);
        const keyRepo = depContainer.resolve(DataSource).getRepository(Key);
        await keyRepo.clear();
        await keyRepo.save({ environment: connection.environment, version: 1, privateKey: keys[0], publicKey: keys[1] });

        delete connection.createdAt;

        const res: { status: number; body: { token: string } } = await requestSender.upsertConnection({ ...connection, token: '' });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.token).not.toBeEmpty();
      });
    });

    describe('GET /client/:clientName/connection', function () {
      it('should return 200 status code all the connections with the specific name', async function () {
        const res = await requestSender.getNamedConnections(connections[0].name);

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((c: IConnection) => c.name === connections[0].name);
      });
    });

    describe('GET /client/:clientName/connection/:environment', function () {
      it('should return 200 status code all the connections with the specific name', async function () {
        const res = await requestSender.getNamedEnvConnections(connections[0].name, Environment.PRODUCTION);

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((c: IConnection) => c.name === connections[0].name && c.environment === Environment.PRODUCTION);
      });
    });

    describe('GET /client/:clientName/connection/:environment/:version', function () {
      it('should return 200 status code and the requested connection', async function () {
        const res = await requestSender.getConnection(connections[2].name, connections[2].environment, connections[2].version);

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ ...connections[2], createdAt: connections[2].createdAt?.toISOString() });
      });
    });
  });

  describe('Bad Path', function () {
    describe('POST /connection', function () {
      it('should return 400 if the request body is incorrect', async function () {
        const connection = getFakeConnection();
        connection.domains = [];
        const res = await requestSender.upsertConnection(connection);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 400 if a domain is not in the DB', async function () {
        const connection = getFakeConnection();
        connection.domains = ['c'];
        const res = await requestSender.upsertConnection(connection);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 400 if token generation failed because of missing private key', async function () {
        const connection = getFakeConnection();
        connection.token = '';
        const res = await requestSender.upsertConnection(connection);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 404 if a client with name is not in the DB', async function () {
        const connection = getFakeIConnection();
        connection.name = faker.random.alphaNumeric(5);
        const res = await requestSender.upsertConnection(connection);

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the request version doesn't match the DB version", async function () {
        const { createdAt, ...connection } = connections[0];
        const res = await requestSender.upsertConnection({ ...connection, version: 5 });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the no connection exists and request version isn't 1", async function () {
        const client = getFakeClient(false);
        await depContainer.resolve(DataSource).getRepository(Client).save(client);

        const res = await requestSender.upsertConnection({ ...getFakeIConnection(), name: client.name, version: 2 });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection', function () {
      it('should return 400 if name value is not valid', async function () {
        const res = await requestSender.getNamedConnections('ai');

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment', function () {
      it('should return 400 if environment value is not valid', async function () {
        const res = await requestSender.getNamedEnvConnections('ai', 'avi' as Environment.PRODUCTION);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment/:version', function () {
      it('should return 400 if version value is not valid', async function () {
        const res = await requestSender.getConnection('avi', Environment.STAGE, -1);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 404 if the connection doesn't exist", async function () {
        const res = await requestSender.getConnection('avi', Environment.STAGE, 999);

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });
  });

  describe('Sad Path', function () {
    afterEach(function () {
      jest.restoreAllMocks();
    });

    describe('GET /connection', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<ConnectionRepository>(SERVICES.CONNECTION_REPOSITORY);
        jest.spyOn(repo, 'find').mockRejectedValue(new Error());

        const res = await requestSender.getConnections();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('POST /connection', function () {
      it('should return 500 status code if db throws an error', async function () {
        const connection = getFakeIConnection();
        connection.name = clients[0].name;

        const repo = depContainer.resolve<DomainRepository>(SERVICES.DOMAIN_REPOSITORY);
        jest.spyOn(repo, 'checkInputForNonExistingDomains').mockRejectedValue(new Error());

        const res = await requestSender.upsertConnection(connection);

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 500 if token generation fails', async function () {
        const connection = getFakeIConnection();
        connection.name = clients[0].name;
        connection.token = '';
        const keyRepo = depContainer.resolve<KeyRepository>(SERVICES.KEY_REPOSITORY);
        jest.spyOn(keyRepo, 'getLatestKeys').mockRejectedValue(new Error());

        const res = await requestSender.upsertConnection(connection);

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<ConnectionRepository>(SERVICES.CONNECTION_REPOSITORY);
        jest.spyOn(repo, 'find').mockRejectedValue(new Error());

        const res = await requestSender.getNamedConnections('avi');

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<ConnectionRepository>(SERVICES.CONNECTION_REPOSITORY);
        jest.spyOn(repo, 'find').mockRejectedValue(new Error());

        const res = await requestSender.getNamedEnvConnections('avi', Environment.NP);

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment/:version', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<ConnectionRepository>(SERVICES.CONNECTION_REPOSITORY);
        jest.spyOn(repo, 'findOne').mockRejectedValue(new Error());

        const res = await requestSender.getConnection('avi', Environment.NP, 1);

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
  });
});
