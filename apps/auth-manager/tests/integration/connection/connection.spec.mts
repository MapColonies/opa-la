/// <reference types="jest-extended" />
import { beforeEach, describe, expect, it, vi, beforeAll, afterEach } from 'vitest';
import httpStatusCodes from 'http-status-codes';
import type { DependencyContainer } from 'tsyringe';
import 'jest-openapi';
import type { Drizzle, Connection, Environments } from '@map-colonies/auth-core';
import { clientTable, connectionTable, domainTable, Environment, keyTable } from '@map-colonies/auth-core';
import { faker } from '@faker-js/faker';
import type { ExpectResponseStatus, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { expectResponseStatusFactory } from '@map-colonies/openapi-helpers/requestSender';
import { getRealKeys, getFakeClient, getFakeConnection } from 'test-utils';
import type { paths, operations } from 'auth-openapi';
import { ConnectionRepository } from '@src/connection/DAL/connectionRepository.js';
import { KeyRepository } from '@src/key/DAL/keyRepository.js';
import { DomainRepository } from '@src/domain/DAL/domainRepository.js';
import { initEnvironment } from '../setup.js';

const expectResponseStatus: ExpectResponseStatus = expectResponseStatusFactory(expect);

describe('connection', function () {
  let requestSender: RequestSender<paths, operations>;
  let depContainer: DependencyContainer;
  let drizzle: Drizzle;
  const clients = [getFakeClient(false), getFakeClient(false)];
  const connections = [
    { ...getFakeConnection(), name: clients[0]!.name, environment: Environment.NP, domains: ['test'] },
    { ...getFakeConnection(), name: clients[0]!.name, environment: Environment.PROD },
    { ...getFakeConnection(), name: clients[0]!.name, environment: Environment.PROD, version: 2 },
    { ...getFakeConnection(), name: clients[1]!.name, environment: Environment.NP },
  ];

  beforeAll(async function () {
    const env = await initEnvironment();
    depContainer = env.container;
    requestSender = env.requestSender;
    drizzle = env.drizzle;
    await drizzle.insert(domainTable).values([{ name: 'alpha' }, { name: 'bravo' }, { name: 'test' }]);
  });

  beforeEach(async function () {
    // await depContainer.resolve(DataSource).getRepository(Client).save(clients);
    // await depContainer.resolve(DataSource).getRepository(Connection).save(connections);
    // await depContainer
    //   .resolve(DataSource)
    //   .getRepository(Domain)
    //   .save([{ name: 'alpha' }, { name: 'bravo' }, { name: 'test' }]);
    const clientQuery = drizzle.insert(clientTable).values(clients);
    const connectionQuery = drizzle.insert(connectionTable).values(connections);
    await Promise.all([clientQuery, connectionQuery]);
  });

  afterEach(async function () {
    // await depContainer.resolve(DataSource).getRepository(Connection).clear();
    // await depContainer.resolve(DataSource).getRepository(Client).clear();
    // await depContainer.resolve(DataSource).getRepository(Domain).clear();
    await Promise.all([drizzle.delete(connectionTable), drizzle.delete(clientTable)]);
  });

  describe('Happy Path', function () {
    describe('GET /connections', function () {
      it('should return 200 status code and all the connections', async function () {
        const res = await requestSender.getConnections();

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();

        // @ts-expect-error need to solve as openapi-helpers is not typed correctly
        const returnedItems = res.body.items as IConnection[];

        expect(returnedItems).toBeArray();
      });

      it.each([
        { name: 'avi', searchParam: 'avi', matchType: 'exact' },
        // { name: 'bobavi', searchParam: 'avi', matchType: 'suffix' },
        // { name: 'aviiiiii', searchParam: 'av', matchType: 'prefix' },
        // { name: 'blaviabla', searchParam: 'avi', matchType: 'middle' },
        // { name: 'avi', searchParam: 'AV', matchType: 'case-insensitive' },
      ])('should find the connection of $name with search string $searchParam with match type $matchType', async function ({ name, searchParam }) {
        const client = { ...getFakeClient(false, { name }) };
        const connection = getFakeConnection(false, { name: client.name });
        // connection.name = client.name;
        // await depContainer.resolve(DataSource).getRepository(Client).insert(client);
        // await requestSender.upsertConnection({ requestBody: connection });
        await drizzle.insert(clientTable).values(client);
        await requestSender.upsertConnection({ requestBody: connection });

        const res = await requestSender.getConnections({
          queryParams: {
            name: searchParam,
          },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect((res.body as Exclude<typeof res.body, { message: string }>).items).toSatisfyAny((item) => item.name === name);
      });

      it('should return empty array when no connections match the client name search param', async function () {
        const client = { ...getFakeClient(false, { name: 'bla' }) };
        const connection = getFakeConnection(false, { name: client.name });
        await drizzle.insert(clientTable).values(client);
        await requestSender.upsertConnection({ requestBody: connection });

        const res = await requestSender.getConnections({
          queryParams: {
            name: 'avi',
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(0);
      });

      it('should return only latest connections when the onlyLatest param is true', async function () {
        // There are 4 connections in the initialization, 3 of them are the latest versions
        const res = await requestSender.getConnections({
          queryParams: {
            onlyLatest: true,
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(3);
      });

      it('should return latest connections for multiple clients', async function () {
        const client = { ...getFakeClient(false) };
        const connection = getFakeConnection(false, { name: client.name });
        // await depContainer.resolve(DataSource).getRepository(Client).insert(client);
        await drizzle.insert(clientTable).values(client);
        await requestSender.upsertConnection({ requestBody: connection });
        await requestSender.upsertConnection({ requestBody: connection });

        const res = await requestSender.getConnections({
          queryParams: {
            onlyLatest: true,
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(4);
      });

      it('should return latest connections with multiple query params', async function () {
        const client = { ...getFakeClient(false) };
        const connection = getFakeConnection(false, { name: client.name });
        // await depContainer.resolve(DataSource).getRepository(Client).insert(client);
        await drizzle.insert(clientTable).values(client);
        await requestSender.upsertConnection({ requestBody: connection });
        await requestSender.upsertConnection({ requestBody: connection });

        const res = await requestSender.getConnections({
          queryParams: {
            onlyLatest: true,
            name: client.name,
            domains: connection.domains,
            isEnabled: connection.enabled,
            sort: ['name:asc'],
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(1);
      });

      it('should return 200 status code and all the connections with specific env', async function () {
        const res = await requestSender.getConnections({ queryParams: { environment: [Environment.PROD] } });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();

        const returnedItems = res.body.items;

        expect(returnedItems).toSatisfyAll((c: Connection) => c.environment.includes(Environment.PROD));
      });

      it('should return 200 status code and all the connections with specific domain', async function () {
        const res = await requestSender.getConnections({ queryParams: { domains: ['test'] } });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();

        const returnedItems = res.body.items;

        expect(returnedItems).toSatisfyAll((c: Connection) => c.domains.includes('test'));
      });
    });

    describe('POST /connection', function () {
      it('should return 201 status code and the created connection', async function () {
        const client = getFakeClient(false);
        const connection = getFakeConnection(false, { name: client.name });
        // await depContainer.resolve(DataSource).getRepository(Client).save(client);
        await drizzle.insert(clientTable).values(client);

        const res = await requestSender.upsertConnection({ requestBody: connection });

        delete connection.createdAt;

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(connection);
        expect(res.body).toHaveProperty('token', connection.token);
      });

      it('should return 200 status code and the updated connection', async function () {
        const client = getFakeClient(false);
        const connection = getFakeConnection(false, { name: client.name });
        // await depContainer.resolve(DataSource).getRepository(Client).save(client);
        // await depContainer.resolve(DataSource).getRepository(Connection).save(connection);
        await drizzle.insert(clientTable).values(client);
        await drizzle.insert(connectionTable).values(connection);

        delete connection.createdAt;

        const res = await requestSender.upsertConnection({ requestBody: connection });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ ...connection, version: 2 });
      });

      it('should not generate a token and return an empty string if no token is supplied and no private key is available and ignoreErrors is true', async function () {
        const client = getFakeClient(false);
        const connection = getFakeConnection(false, { name: client.name, token: '' });
        // connection.name = client.name;
        // connection.token = '';
        // await depContainer.resolve(DataSource).getRepository(Client).save(client);
        await drizzle.insert(clientTable).values(client);

        const res = await requestSender.upsertConnection({ requestBody: connection, queryParams: { shouldIgnoreTokenErrors: true } });
        delete connection.createdAt;

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toHaveProperty('token', '');
      });

      it('should generate a token if no token is supplied and private key is available', async function () {
        const client = getFakeClient(false);
        const connection = getFakeConnection(false, { name: client.name, environment: Environment.STAGE });
        const keys = getRealKeys();
        // connection.name = client.name;
        // connection.environment = Environment.STAGE;
        // await depContainer.resolve(DataSource).getRepository(Client).save(client);
        // await depContainer.resolve(DataSource).getRepository(Connection).save(connection);
        await drizzle.insert(clientTable).values(client);
        await drizzle.insert(connectionTable).values(connection);
        // const keyRepo = depContainer.resolve(DataSource).getRepository(Key);
        // await keyRepo.clear();
        // await keyRepo.save({ environment: connection.environment, version: 1, privateKey: keys[0], publicKey: keys[1] });
        await drizzle.insert(keyTable).values({ environment: connection.environment, version: 1, privateKey: keys[0], publicKey: keys[1] });

        delete connection.createdAt;

        const res = await requestSender.upsertConnection({ requestBody: { ...connection, token: '' } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toHaveProperty('token', expect.stringMatching(/^.+$/));
      });

      it('should create a connection with origins sorted with asterisk strings last', async function () {
        const client = getFakeClient(false);
        const connection = getFakeConnection(false, { name: client.name, origins: ['http://example.com', 'https://*.test.com', 'http://foo.com'] });
        // connection.name = client.name;
        // connection.origins = ['http://example.com', 'https://*.test.com', 'http://foo.com'];
        // await depContainer.resolve(DataSource).getRepository(Client).save(client);
        await drizzle.insert(clientTable).values(client);

        const res = await requestSender.upsertConnection({ requestBody: connection });

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toHaveProperty('origins', ['http://example.com', 'http://foo.com', 'https://*.test.com']);
      });
    });

    describe('GET /client/:clientName/connection', function () {
      it('should return 200 status code all the connections with the specific name', async function () {
        const res = await requestSender.getClientConnections({ pathParams: { clientName: connections[0]!.name } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((c: Connection) => c.name === connections[0]!.name);
      });
    });

    describe('GET /client/:clientName/connection/:environment', function () {
      it('should return 200 status code all the connections with the specific name', async function () {
        const res = await requestSender.getClientEnvironmentConnections({
          pathParams: { clientName: connections[0]!.name, environment: Environment.PROD },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((c: Connection) => c.name === connections[0]!.name && c.environment === Environment.PROD);
      });
    });

    describe('GET /client/:clientName/connection/:environment/:version', function () {
      it('should return 200 status code and the requested connection', async function () {
        const res = await requestSender.getClientVersionedConnection({
          pathParams: { clientName: connections[2]!.name, environment: connections[2]!.environment, version: connections[2]!.version },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ ...connections[2], createdAt: connections[2]!.createdAt?.toISOString() });
      });
    });

    describe('GET /client/:clientName/connection/:environment/latest', function () {
      it('should return 200 status code and the latest connection for the environment', async function () {
        const expectedConnection = connections.find((c) => c.name === connections[0]!.name && c.environment === Environment.PROD && c.version === 2);

        const res = await requestSender.getClientLatestConnection({
          pathParams: { clientName: connections[0]!.name, environment: Environment.PROD },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(res.body).toStrictEqual({ ...expectedConnection, createdAt: expect.any(String) });
      });

      it('should return 200 status code and the only connection when there is only one version', async function () {
        const expectedConnection = connections.find((c) => c.name === connections[0]!.name && c.environment === Environment.NP);

        const res = await requestSender.getClientLatestConnection({
          pathParams: { clientName: connections[0]!.name, environment: Environment.NP },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(res.body).toStrictEqual({ ...expectedConnection, createdAt: expect.any(String) });
      });
    });
  });

  describe('Bad Path', function () {
    describe('POST /connection', function () {
      it.only('should return 400 if the request body is incorrect', async function () {
        const connection = getFakeConnection(false, { name: clients[0]!.name, domains: [] });
        const res = await requestSender.upsertConnection({ requestBody: connection });
        console.log(res.body);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 400 if a domain is not in the DB', async function () {
        const connection = getFakeConnection(false, { name: clients[0]!.name });
        connection.domains = ['c'];
        const res = await requestSender.upsertConnection({ requestBody: connection });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 400 if token generation failed because of missing private key', async function () {
        const connection = getFakeConnection(false, { name: clients[0]!.name });
        connection.token = '';
        const res = await requestSender.upsertConnection({ requestBody: connection });
        console.log(res.body);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 404 if a client with name is not in the DB', async function () {
        const connection = getFakeConnection(false, { name: faker.string.alpha(5) });
        // connection.name = faker.string.alpha(5);
        const res = await requestSender.upsertConnection({ requestBody: connection });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the request version doesn't match the DB version", async function () {
        const { createdAt, ...connection } = connections[0]!;
        const res = await requestSender.upsertConnection({ requestBody: { ...connection, version: 5 } });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the no connection exists and request version isn't 1", async function () {
        const client = getFakeClient(false);
        // await depContainer.resolve(DataSource).getRepository(Client).save(client);
        await drizzle.insert(clientTable).values(client);

        const res = await requestSender.upsertConnection({ requestBody: { ...getFakeConnection(), name: client.name, version: 2 } });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection', function () {
      it('should return 400 if name value is not valid', async function () {
        const res = await requestSender.getClientConnections({ pathParams: { clientName: 'AI' } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment', function () {
      it('should return 400 if environment value is not valid', async function () {
        const res = await requestSender.getClientEnvironmentConnections({
          pathParams: { clientName: 'avi', environment: 'avi' as Environments },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment/:version', function () {
      it('should return 400 if version value is not valid', async function () {
        const res = await requestSender.getClientVersionedConnection({
          pathParams: { clientName: 'avi', environment: Environment.STAGE, version: -1 },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 404 if the connection doesn't exist", async function () {
        const res = await requestSender.getClientVersionedConnection({
          pathParams: { clientName: 'avi', environment: Environment.STAGE, version: 999 },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment/latest', function () {
      it('should return 400 if clientName value is not valid', async function () {
        const res = await requestSender.getClientLatestConnection({
          pathParams: { clientName: 'AI', environment: Environment.STAGE },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 400 if environment value is not valid', async function () {
        const res = await requestSender.getClientLatestConnection({
          pathParams: { clientName: 'avi', environment: 'avi' as Environments },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 404 if no connection exists for the client and environment', async function () {
        const res = await requestSender.getClientLatestConnection({
          pathParams: { clientName: 'avi', environment: Environment.STAGE },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });
  });

  describe('Sad Path', function () {
    afterEach(function () {
      vi.restoreAllMocks();
    });

    describe('GET /connection', function () {
      it('should return 500 status code if db throws an error', async function () {
        // const repo = depContainer.resolve<ConnectionRepository>(SERVICES.CONNECTION_REPOSITORY);
        // const qbMock = {
        //   getMany: vi.fn().mockRejectedValue(new Error('DB Error')),
        // };
        // // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        // vi.spyOn(repo, 'createQueryBuilder').mockReturnValue(qbMock as any);
        vi.spyOn(drizzle, 'select').mockRejectedValue(new Error('DB Error'));

        const res = await requestSender.getConnections();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('POST /connection', function () {
      it('should return 500 status code if db throws an error', async function () {
        const connection = getFakeConnection();
        connection.name = clients[0]!.name;

        const repo = depContainer.resolve(DomainRepository);
        vi.spyOn(repo, 'checkInputForNonExistingDomains').mockRejectedValue(new Error());

        const res = await requestSender.upsertConnection({ requestBody: connection });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 500 if token generation fails', async function () {
        const connection = getFakeConnection();
        connection.name = clients[0]!.name;
        connection.token = '';
        const keyRepo = depContainer.resolve(KeyRepository);
        vi.spyOn(keyRepo, 'getLatestKeys').mockRejectedValue(new Error());

        const res = await requestSender.upsertConnection({ requestBody: connection });
        console.log(res.body);

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection', function () {
      it('should return 500 status code if db throws an error', async function () {
        // const repo = depContainer.resolve(ConnectionRepository);
        // const qbMock = {
        //   getMany: vi.fn().mockRejectedValue(new Error('DB Error')),
        // };
        vi.spyOn(drizzle, 'select').mockRejectedValue(new Error('DB Error'));

        const res = await requestSender.getClientConnections({ pathParams: { clientName: 'avi' } });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment', function () {
      it('should return 500 status code if db throws an error', async function () {
        // const repo = depContainer.resolve<ConnectionRepository>(SERVICES.CONNECTION_REPOSITORY);
        // const qbMock = {
        //   getMany: vi.fn().mockRejectedValue(new Error('DB Error')),
        // };
        vi.spyOn(drizzle, 'select').mockRejectedValue(new Error('DB Error'));

        const res = await requestSender.getClientEnvironmentConnections({ pathParams: { clientName: 'avi', environment: Environment.NP } });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment/:version', function () {
      it('should return 500 status code if db throws an error', async function () {
        const connection = getFakeConnection();
        connection.name = clients[0]!.name;
        connection.environment = Environment.NP;

        await requestSender.upsertConnection({ requestBody: connection });
        // const repo = depContainer.resolve<ConnectionRepository>(SERVICES.CONNECTION_REPOSITORY);
        // vi.spyOn(repo, 'findOne').mockRejectedValue(new Error());
        vi.spyOn(drizzle.query.connection, 'findFirst').mockRejectedValue(new Error());

        const res = await requestSender.getClientVersionedConnection({
          pathParams: { clientName: clients[0]!.name, environment: Environment.NP, version: 1 },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName/connection/:environment/latest', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve(ConnectionRepository);
        vi.spyOn(repo, 'getMaxVersion').mockRejectedValue(new Error());

        const res = await requestSender.getClientLatestConnection({
          pathParams: { clientName: connections[0]!.name, environment: Environment.NP },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
  });
});
