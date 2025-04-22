/// <reference types="jest-extended" />
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import 'jest-openapi';
import { DataSource } from 'typeorm';
import { IKey, Environment, Key } from '@map-colonies/auth-core';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { KeyRepository } from '../../../src/key/DAL/keyRepository';
import { getMockKeys } from '../../utils/key';
import { initConfig } from '../../../src/common/config';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations, components } from '@openapi';

describe('key', function () {
  const OPENAPI_SPEC_PATH = 'openapi3.yaml'; // Path to the OpenAPI spec file

  let requestSender: RequestSender<paths, operations>;
  let depContainer: DependencyContainer;

  beforeAll(async function () {
    await initConfig();
  });

  beforeEach(async function () {
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

  afterEach(async function () {
    await depContainer.resolve(DataSource).destroy();
  });

  describe('Happy Path', function () {
    describe('GET /key', function () {
      it('should return 200 status code and all the latest keys', async function () {
        const [privateKey, publicKey] = getMockKeys();
        const keys: IKey[] = [
          { environment: Environment.NP, version: 1, privateKey, publicKey },
          { environment: Environment.NP, version: 2, privateKey, publicKey },
          { environment: Environment.STAGE, version: 1, privateKey, publicKey },
        ];

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Key).save(keys);

        const res = await requestSender.getLastestKeys();

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toIncludeAllPartialMembers([keys[2], keys[1]]);
        expect(res.body).not.toIncludeAnyMembers([keys[0]]);
      });
    });

    describe('POST /key', function () {
      it('should return 201 status code and the created key', async function () {
        const [privateKey, publicKey] = getMockKeys();

        const res = await requestSender.upsertKey({ requestBody: { version: 1, environment: Environment.PRODUCTION, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ version: 1, environment: Environment.PRODUCTION, privateKey, publicKey });
      });

      it('should return 200 status code and the updated key', async function () {
        const [privateKey, publicKey] = getMockKeys();
        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Key).save({ version: 1, environment: Environment.PRODUCTION, privateKey, publicKey });

        const res = await requestSender.upsertKey({ requestBody: { version: 1, environment: Environment.PRODUCTION, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ version: 2, environment: Environment.PRODUCTION, privateKey, publicKey });
      });
    });

    describe('GET /key/:environment', function () {
      it('should return 200 status code all the keys in the specific environment', async function () {
        const [privateKey, publicKey] = getMockKeys();
        const keys: IKey[] = [
          { environment: Environment.STAGE, version: 2, privateKey, publicKey },
          { environment: Environment.STAGE, version: 1, privateKey, publicKey },
        ];

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Key).save(keys);

        const res = await requestSender.getKeys({ pathParams: { environment: Environment.STAGE } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toIncludeAllMembers(keys);
      });
    });

    describe('GET /key/:environment/:version', function () {
      it('should return 200 status code and the requested key', async function () {
        const [privateKey, publicKey] = getMockKeys();
        const key = { environment: Environment.NP, version: 3, privateKey, publicKey };
        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Key).save(key);

        const res = await requestSender.getSpecificKey({ pathParams: { environment: Environment.NP, version: 3 } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual(key);
      });
    });
  });

  describe('Bad Path', function () {
    describe('POST /key', function () {
      it('should return 400 if the request body is incorrect', async function () {
        const [privateKey] = getMockKeys();

        const res = await requestSender.upsertKey({
          requestBody: { environment: Environment.NP, version: 3, privateKey } as components['schemas']['key'],
        });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the request version doesn't match the DB version", async function () {
        const [privateKey, publicKey] = getMockKeys();

        const res = await requestSender.upsertKey({ requestBody: { environment: Environment.NP, version: 99, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the no key exists and request version isn't 1", async function () {
        const [privateKey, publicKey] = getMockKeys();

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Key).delete({ environment: Environment.NP });

        const res = await requestSender.upsertKey({ requestBody: { environment: Environment.NP, version: 2, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /key/:environment', function () {
      it('should return 400 if environment value is not valid', async function () {
        const res = await requestSender.getKeys({ pathParams: { environment: 'avi' as Environment } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /key/:environment/:version', function () {
      it('should return 400 if version value is not valid', async function () {
        const res = await requestSender.getSpecificKey({ pathParams: { environment: Environment.PRODUCTION, version: -1 } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 404 if the key doesn't exist", async function () {
        const res = await requestSender.getSpecificKey({ pathParams: { environment: Environment.PRODUCTION, version: 999 } });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });
  });
  describe('Sad Path', function () {
    afterEach(function () {
      jest.restoreAllMocks();
    });

    describe('GET /key', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<KeyRepository>(SERVICES.KEY_REPOSITORY);
        jest.spyOn(repo, 'getLatestKeys').mockRejectedValue(new Error());

        const res = await requestSender.getLastestKeys();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
    describe('POST /key', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<KeyRepository>(SERVICES.KEY_REPOSITORY);
        jest.spyOn(repo, 'getMaxVersionWithLock').mockRejectedValue(new Error());
        const [privateKey, publicKey] = getMockKeys();

        const res = await requestSender.upsertKey({ requestBody: { environment: Environment.NP, version: 1, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });

      describe('GET /key/:environment', function () {
        it('should return 500 status code if db throws an error', async function () {
          const repo = depContainer.resolve<KeyRepository>(SERVICES.KEY_REPOSITORY);
          jest.spyOn(repo, 'find').mockRejectedValue(new Error());

          const res = await requestSender.getKeys({ pathParams: { environment: Environment.NP } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });

      describe('GET /key/:environment/:version', function () {
        it('should return 500 status code if db throws an error', async function () {
          const repo = depContainer.resolve<KeyRepository>(SERVICES.KEY_REPOSITORY);
          jest.spyOn(repo, 'findOne').mockRejectedValue(new Error());

          const res = await requestSender.getSpecificKey({ pathParams: { environment: Environment.NP, version: 1 } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });
    });
  });
});
