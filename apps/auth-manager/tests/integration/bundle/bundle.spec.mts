/// <reference types="jest-extended" />
import { afterEach, describe, expect, it, vi, beforeAll } from 'vitest';
import { faker } from '@faker-js/faker';
import httpStatusCodes from 'http-status-codes';
import type { DependencyContainer } from 'tsyringe';
import type { Drizzle, Environments, Bundle } from '@map-colonies/auth-core';
import { bundleTable, Environment } from '@map-colonies/auth-core';
import 'jest-openapi';
import type { ExpectResponseStatus, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { expectResponseStatusFactory } from '@map-colonies/openapi-helpers/requestSender';
import { getFakeBundle } from 'test-utils';
import type { paths, operations } from 'auth-openapi';
import { initEnvironment } from '../setup.js';

const expectResponseStatus: ExpectResponseStatus = expectResponseStatusFactory(expect);
type ApiBundle = operations['getBundle']['responses']['200']['content']['application/json'];

describe('bundle', function () {
  let requestSender: RequestSender<paths, operations>;
  let drizzle: Drizzle;
  let bundles: [ApiBundle, ApiBundle, ApiBundle];

  beforeAll(async function () {
    const env = await initEnvironment();
    requestSender = env.requestSender;
    drizzle = env.drizzle;

    bundles = (
      await drizzle
        .insert(bundleTable)
        .values([getFakeBundle(), { ...getFakeBundle(), environment: Environment.PROD }, getFakeBundle()])
        .returning()
    ).map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })) as [ApiBundle, ApiBundle, ApiBundle];
    // bundles.forEach((b) => delete b.createdAt);
  });

  describe('Happy Path', function () {
    describe('GET /bundle', function () {
      it('should return 200 status code and a list of bundles', async function () {
        const res = await requestSender.getBundles();

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toBeArray();
      });

      it('should return 200 status code and a list of bundles that match the search', async function () {
        const res = await requestSender.getBundles({ queryParams: { environment: [Environment.NP] } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((b: Bundle) => b.environment === Environment.NP);
      });

      it('should support filtering bundles by createdBefore and createdAfter', async function () {
        const bundle = await requestSender.getBundle({ pathParams: { id: bundles[0].id as number } });

        expectResponseStatus(bundle, httpStatusCodes.OK);
        const bundleBody = bundle.body;

        const createdBefore = faker.date.future({ refDate: bundleBody.createdAt });
        const createdAfter = faker.date.past({ refDate: bundleBody.createdAt });

        const res = await requestSender.getBundles({
          queryParams: { createdBefore: createdBefore.toISOString(), createdAfter: createdAfter.toISOString() },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /bundle/:id', function () {
      it('should return 201 status code and the created bundle', async function () {
        const res = await requestSender.getBundle({ pathParams: { id: bundles[0].id as number } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(bundles[0]);
      });
    });
  });

  describe('Bad Path', function () {
    describe('GET /bundle', function () {
      it('should return 400 status code if the environment value is invalid', async function () {
        const res = await requestSender.getBundles({ queryParams: { environment: ['avi'] as unknown as Environments[] } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /bundle/:id', function () {
      it('should return 400 status code if the id value is bad', async function () {
        const res = await requestSender.getBundle({ pathParams: { id: -1 } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'request/params/id must be >= 1' });
      });

      it('should return 404 status code if a bundle with the given id was not found', async function () {
        const res = await requestSender.getBundle({ pathParams: { id: 420 } });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });
  });

  describe('Sad Path', function () {
    afterEach(function () {
      vi.restoreAllMocks();
    });

    describe('GET /bundle', function () {
      it('should return 500 status code if db throws an error', async function () {
        vi.spyOn(drizzle.query.bundle, 'findMany').mockRejectedValue(new Error());
        const res = await requestSender.getBundles();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /bundle/:id', function () {
      it('should return 500 status code if db throws an error', async function () {
        vi.spyOn(drizzle.query.bundle, 'findFirst').mockRejectedValue(new Error());

        const res = await requestSender.getBundle({ pathParams: { id: 1 } });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
  });
});
