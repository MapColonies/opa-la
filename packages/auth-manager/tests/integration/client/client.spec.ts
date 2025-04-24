/// <reference types="jest-extended" />
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import { faker } from '@faker-js/faker';
import 'jest-openapi';
import { DataSource } from 'typeorm';
import { Client } from '@map-colonies/auth-core';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { getFakeClient } from '../../utils/client';
import { initConfig } from '../../../src/common/config';
import { ClientRepository } from '@src/client/DAL/clientRepository';

describe('client', function () {
  let requestSender: RequestSender<paths, operations>;
  let depContainer: DependencyContainer;

  beforeAll(async function () {
    await initConfig();
    const [app, container] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });
    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
    depContainer = container;
  });

  afterAll(async function () {
    await depContainer.resolve(DataSource).destroy();
  });

  describe('Happy Path', function () {
    describe('GET /client', function () {
      it('should return 200 status code and a list of clients', async function () {
        const clients = [getFakeClient(false), getFakeClient(false)];

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Client).insert(clients.map((c) => ({ ...c })));

        const res = await requestSender.getClients();

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toIncludeAllPartialMembers(clients);
      });
    });

    describe('POST /client', function () {
      it('should return 201 status code and the created client', async function () {
        const client = getFakeClient(false);

        const res = await requestSender.createClient({ requestBody: client });

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(client);
      });
    });

    describe('GET /client/:clientName', function () {
      it('should return 200 status code and the client', async function () {
        const client = getFakeClient(false);

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Client).insert({ ...client });

        const res = await requestSender.getClient({ pathParams: { clientName: client.name } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(client);
      });
    });

    describe('PATCH /client/:clientName', function () {
      it('should return 200 status code and the updated client', async function () {
        const client = getFakeClient(false);

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Client).insert({ ...client });

        const res = await requestSender.updateClient({
          pathParams: { clientName: client.name },
          requestBody: { ...client, description: 'xd', tags: ['a', 'b'] },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ ...client, description: 'xd', tags: ['a', 'b'] });
      });
    });
  });

  describe('Bad Path', function () {
    describe('POST /client', function () {
      it('should return 400 status code if the name is too short', async function () {
        const client = getFakeClient(false);
        client.name = 'a';

        const res = await requestSender.createClient({ requestBody: client });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'request/body/name must NOT have fewer than 2 characters' });
      });

      it('should return 400 status code if the name is too long', async function () {
        const client = getFakeClient(false);
        client.name = faker.datatype.string(33);

        const res = await requestSender.createClient({ requestBody: client });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'request/body/name must NOT have more than 32 characters' });
      });

      it.only('should return 409 status code if client with the same name already exists', async function () {
        const client = getFakeClient(false);

        const res1 = await requestSender.createClient({ requestBody: client });

        console.log(res1.body);
        expect(res1).toHaveProperty('status', httpStatusCodes.CREATED);

        const res2 = await requestSender.createClient({ requestBody: client });

        expect(res2).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res2).toSatisfyApiSpec();
        expect(res2.body).toStrictEqual({ message: 'client already exists' });
      });
    });
    describe('GET /client/:clientName', function () {
      it('should return 404 status code if the client was not found', async function () {
        const res = await requestSender.getClient({ pathParams: { clientName: 'lol' } });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: "A client with the given name doesn't exists in the database" });
      });
    });

    describe('PATCH /client/:clientName', function () {
      it('should return 404 status code if the client was not found', async function () {
        const client = getFakeClient(false);

        const res = await requestSender.updateClient({
          pathParams: { clientName: 'lol' },
          requestBody: client,
        });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'client with given name was not found' });
      });
    });
  });
  describe('Sad Path', function () {
    afterEach(function () {
      jest.restoreAllMocks();
    });

    describe('GET /client', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<ClientRepository>(SERVICES.CLIENT_REPOSITORY);
        jest.spyOn(repo, 'find').mockRejectedValue(new Error());

        const res = await requestSender.getClients();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
    describe('POST /client', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<ClientRepository>(SERVICES.CLIENT_REPOSITORY);
        jest.spyOn(repo, 'insert').mockRejectedValue(new Error());

        const res = await requestSender.createClient({ requestBody: getFakeClient(false) });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });

      describe('GET /client/:clientName', function () {
        it('should return 500 status code if db throws an error', async function () {
          const repo = depContainer.resolve<ClientRepository>(SERVICES.CLIENT_REPOSITORY);
          jest.spyOn(repo, 'findOne').mockRejectedValue(new Error());

          const res = await requestSender.getClient({ pathParams: { clientName: 'avi' } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });

      describe('PATCH /client/:clientName', function () {
        it('should return 500 status code if db throws an error', async function () {
          const repo = depContainer.resolve<ClientRepository>(SERVICES.CLIENT_REPOSITORY);
          jest.spyOn(repo, 'updateAndReturn').mockRejectedValue(new Error());

          const res = await requestSender.updateClient({
            pathParams: { clientName: 'avi' },
            requestBody: getFakeClient(false),
          });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });
    });
  });
});
