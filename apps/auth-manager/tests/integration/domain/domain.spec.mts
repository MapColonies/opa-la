import { beforeEach, describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import type { DependencyContainer } from 'tsyringe';
import { faker } from '@faker-js/faker';
import 'jest-openapi';
import { Pool } from 'pg';
import type { Drizzle } from '@map-colonies/auth-core';
import { domainTable } from '@map-colonies/auth-core';
import type { ExpectResponseStatus, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { createRequestSender, expectResponseStatusFactory } from '@map-colonies/openapi-helpers/requestSender';
import type { paths, operations } from 'auth-openapi';
import { getApp } from '@src/app.js';
import { SERVICES } from '@src/common/constants.js';
import { initConfig } from '@src/common/config.js';
import { OPENAPI_PATH } from '@tests/utils/paths.mjs';
import { initEnvironment } from '../setup.js';

const expectResponseStatus: ExpectResponseStatus = expectResponseStatusFactory(expect);

describe('domain', function () {
  let requestSender: RequestSender<paths, operations>;
  let drizzle: Drizzle;

  beforeAll(async function () {
    const env = await initEnvironment();
    requestSender = env.requestSender;
    drizzle = env.drizzle;
  });

  describe('Happy Path', function () {
    describe('GET /domain', function () {
      it('should return 200 status code and a list of domains', async function () {
        // const drizzle = depContainer.resolve<Drizzle>(SERVICES.DRIZZLE);
        await drizzle.insert(domainTable).values([{ name: 'avi' }, { name: 'iva' }]);

        const res = await requestSender.getDomains();

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();

        const returnedItems = res.body.items;

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
    const MockProvider = { select: vi.fn(), insert: vi.fn() };
    let mockedSender: RequestSender<paths, operations>;

    beforeEach(async function () {
      const [app, container] = await getApp({
        override: [
          { token: SERVICES.LOGGER, provider: { useValue: await jsLogger({ enabled: false }) } },
          { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
          { token: SERVICES.DRIZZLE, provider: { useValue: MockProvider } },
        ],
        useChild: true,
      });
      mockedSender = await createRequestSender<paths, operations>(OPENAPI_PATH, app);
      await container.resolve(Pool).end();
      vi.resetAllMocks();
    });

    describe('GET /domain', function () {
      it('should return 500 status code if db throws an error', async function () {
        MockProvider.select.mockRejectedValue(new Error(''));

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
