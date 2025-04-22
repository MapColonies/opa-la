/// <reference types="jest-extended" />
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';
import { Bundle, Environment, IBundle } from '@map-colonies/auth-core';
import 'jest-openapi';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { getFakeBundle } from '../../utils/bundle';
import { initConfig } from '../../../src/common/config';

describe('bundle', function () {
  let requestSender: RequestSender<paths, operations>;
  let depContainer: DependencyContainer;
  const bundles = [getFakeBundle(), { ...getFakeBundle(), environment: Environment.PRODUCTION }, getFakeBundle()];

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

    await container.resolve(DataSource).getRepository(Bundle).save(bundles);
    bundles.forEach((b) => delete b.createdAt);
  });

  afterAll(async function () {
    await depContainer.resolve(DataSource).destroy();
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body).toSatisfyAll((b: Bundle) => b.environment === Environment.NP);
      });
    });

    describe('GET /bundle/:id', function () {
      it('should return 201 status code and the created bundle', async function () {
        const firstBundle = bundles[0] as IBundle;
        const res = await requestSender.getBundle({ pathParams: { id: firstBundle.id as number } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(firstBundle);
      });
    });
  });

  describe('Bad Path', function () {
    describe('GET /bundle', function () {
      it('should return 400 status code if the environment value is invalid', async function () {
        const res = await requestSender.getBundles({ queryParams: { environment: ['avi'] as unknown as Environment[] } });

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
      jest.restoreAllMocks();
    });

    describe('GET /bundle', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<Repository<Bundle>>(SERVICES.BUNDLE_REPOSITORY);
        const spy = jest.spyOn(repo, 'findBy');
        spy.mockRejectedValue(new Error());
        const res = await requestSender.getBundles();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /bundle/:id', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<Repository<Bundle>>(SERVICES.BUNDLE_REPOSITORY);

        jest.spyOn(repo, 'findOneBy').mockRejectedValue(new Error());

        const res = await requestSender.getBundle({ pathParams: { id: 1 } });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
  });
});
