import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import 'jest-openapi';
import { Domain, IDomain } from '@map-colonies/auth-core';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@src/common/constants';
import { initConfig } from '@src/common/config';

describe('domain', function () {
  const OPENAPI_SPEC_PATH = 'openapi3.yaml'; // Path to the OpenAPI spec file

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
    requestSender = await createRequestSender<paths, operations>(OPENAPI_SPEC_PATH, app);
    depContainer = container;
  });

  afterAll(async function () {
    await depContainer.resolve(DataSource).destroy();
  });

  describe('Happy Path', function () {
    describe('GET /domain', function () {
      it('should return 200 status code and a list of domains', async function () {
        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Domain).save([{ name: 'avi' }, { name: 'iva' }]);

        const res = await requestSender.getDomains();

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        // @ts-expect-error need to solve as openapi-helpers is not typed correctly
        const returnedItems = res.body.items as IDomain[];
        expect(returnedItems).toEqual(expect.arrayContaining([{ name: 'avi' }, { name: 'iva' }]));
      });
    });

    describe('POST /domain', function () {
      it('should return 201 status code and the created domain', async function () {
        const domain = { name: 'aviavi' };

        const res = await requestSender.createDomain({ requestBody: domain });

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ name: 'aviavi' });
      });
    });
  });
  describe('Bad Path', function () {
    describe('POST /domain', function () {
      it('should return 400 status code if the name is too short', async function () {
        const domain = { name: faker.string.alpha(1) };

        const res = await requestSender.createDomain({ requestBody: domain });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'request/body/name must NOT have fewer than 2 characters' });
      });

      it('should return 400 status code if the name is too long', async function () {
        const domain = { name: faker.string.alpha(33) };

        const res = await requestSender.createDomain({ requestBody: domain });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'request/body/name must NOT have more than 32 characters' });
      });

      it('should return 409 status code if domain with the same name already', async function () {
        const domain = { name: faker.string.alpha(16) };

        const res1 = await requestSender.createDomain({ requestBody: domain });

        expect(res1).toHaveProperty('status', httpStatusCodes.CREATED);

        const res2 = await requestSender.createDomain({ requestBody: domain });

        expect(res2).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res2).toSatisfyApiSpec();
        expect(res2.body).toStrictEqual({ message: 'domain already exists' });
      });
    });
  });
  describe('Sad Path', function () {
    const MockProvider = { insert: jest.fn(), find: jest.fn() };
    let mockedSender: RequestSender<paths, operations>;
    beforeEach(async function () {
      const [app, container] = await getApp({
        override: [
          { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
          { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
          { token: SERVICES.DOMAIN_REPOSITORY, provider: { useValue: MockProvider } },
        ],
        useChild: true,
      });
      mockedSender = await createRequestSender<paths, operations>(OPENAPI_SPEC_PATH, app);
      await container.resolve(DataSource).destroy();
      jest.resetAllMocks();
    });
    describe('GET /domain', function () {
      it('should return 500 status code if db throws an error', async function () {
        MockProvider.find.mockRejectedValue(new Error(''));

        const res = await mockedSender.getDomains();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
    describe('POST /domain', function () {
      it('should return 500 status code if db throws an error', async function () {
        MockProvider.insert.mockRejectedValue(new Error(''));
        const domain = { name: faker.string.alpha(8) };

        const res = await mockedSender.createDomain({ requestBody: domain });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
  });
});
