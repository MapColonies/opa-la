/// <reference types="jest-extended" />
import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest';
import httpStatusCodes from 'http-status-codes';
import 'jest-openapi';
import type { RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { eq } from 'drizzle-orm';
import type { Drizzle, Environments, Key } from '@map-colonies/auth-core';
import { Environment, keyTable } from '@map-colonies/auth-core';
import { getMockKeys } from 'test-utils';
import type { DependencyContainer } from 'tsyringe';
import type { paths, operations, components } from 'auth-openapi';
import { KeyRepository } from '@src/key/DAL/keyRepository.js';
import { initEnvironment } from '../setup.js';

describe('key', function () {
  let requestSender: RequestSender<paths, operations>;
  let drizzle: Drizzle;
  let depContainer: DependencyContainer;

  beforeAll(async function () {
    const env = await initEnvironment();
    requestSender = env.requestSender;
    drizzle = env.drizzle;
    depContainer = env.container;
  });

  describe('Happy Path', function () {
    describe('GET /key', function () {
      it('should return 200 status code and all the latest keys', async function () {
        const [privateKey, publicKey] = getMockKeys();
        const keys: Key[] = [
          { environment: Environment.NP, version: 1, privateKey, publicKey },
          { environment: Environment.NP, version: 2, privateKey, publicKey },
          { environment: Environment.STAGE, version: 2, privateKey, publicKey },
          { environment: Environment.STAGE, version: 1, privateKey, publicKey },
        ];

        await drizzle.insert(keyTable).values(keys).onConflictDoNothing();
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

        const res = await requestSender.upsertKey({ requestBody: { version: 1, environment: Environment.PROD, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ version: 1, environment: Environment.PROD, privateKey, publicKey });
      });

      it('should return 200 status code and the updated key', async function () {
        const [privateKey, publicKey] = getMockKeys();
        await drizzle.insert(keyTable).values({ version: 1, environment: Environment.PROD, privateKey, publicKey }).onConflictDoNothing();

        const res = await requestSender.upsertKey({ requestBody: { version: 1, environment: Environment.PROD, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ version: 2, environment: Environment.PROD, privateKey, publicKey });
      });
    });

    describe('GET /key/:environment', function () {
      it('should return 200 status code all the keys in the specific environment', async function () {
        const [privateKey, publicKey] = getMockKeys();
        const keys: Key[] = [
          { environment: Environment.STAGE, version: 2, privateKey, publicKey },
          { environment: Environment.STAGE, version: 1, privateKey, publicKey },
        ];

        // @ts-expect-error - eq throws an error for some weird reason
        await drizzle.delete(keyTable).where(eq(keyTable.environment, Environment.STAGE));
        await drizzle.insert(keyTable).values(keys).onConflictDoNothing();

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
        await drizzle.insert(keyTable).values(key).onConflictDoNothing();

        const res = await requestSender.getSpecificKey({ pathParams: { environment: Environment.NP, version: 3 } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual(key);
      });
    });

    describe('GET /key/:environment/latest', () => {
      it('should return 200 status code and the latest key when multiple versions exist', async function () {
        const [privateKey, publicKey] = getMockKeys();
        const keys: Key[] = [
          { environment: Environment.STAGE, version: 1, privateKey, publicKey },
          { environment: Environment.STAGE, version: 2, privateKey, publicKey },
          { environment: Environment.STAGE, version: 3, privateKey, publicKey },
        ];

        await drizzle.insert(keyTable).values(keys).onConflictDoNothing();

        const expectedKey = keys.find((k) => k.version === 3);

        const res = await requestSender.getLatestKey({ pathParams: { environment: Environment.STAGE } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual(expectedKey);
      });

      it('should return 200 status code and the only key when there is only one version', async function () {
        const [privateKey, publicKey] = getMockKeys();
        const key: Key = { environment: Environment.PROD, version: 1, privateKey, publicKey };

        // @ts-expect-error - eq throws an error for some weird reason
        await drizzle.delete(keyTable).where(eq(keyTable.environment, Environment.PROD)); // Ensure no previous keys exist
        await drizzle.insert(keyTable).values(key);

        const res = await requestSender.getLatestKey({ pathParams: { environment: Environment.PROD } });

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

        // @ts-expect-error - eq throws an error for some weird reason
        await drizzle.delete(keyTable).where(eq(keyTable.environment, Environment.NP));

        const res = await requestSender.upsertKey({ requestBody: { environment: Environment.NP, version: 2, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /key/:environment', function () {
      it('should return 400 if environment value is not valid', async function () {
        const res = await requestSender.getKeys({ pathParams: { environment: 'avi' as Environments } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /key/:environment/:version', function () {
      it('should return 400 if version value is not valid', async function () {
        const res = await requestSender.getSpecificKey({ pathParams: { environment: Environment.PROD, version: -1 } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 404 if the key doesn't exist", async function () {
        const res = await requestSender.getSpecificKey({ pathParams: { environment: Environment.PROD, version: 999 } });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /key/:environment/latest', () => {
      it('should return 400 if environment value is not valid', async function () {
        const res = await requestSender.getLatestKey({ pathParams: { environment: 'avi' as Environments } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 404 if no key exists for the given environment', async function () {
        // @ts-expect-error - eq throws an error for some weird reason
        await drizzle.delete(keyTable).where(eq(keyTable.environment, Environment.PROD));

        const res = await requestSender.getLatestKey({ pathParams: { environment: Environment.PROD } });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });
  });

  describe('Sad Path', function () {
    afterEach(function () {
      vi.restoreAllMocks();
    });

    describe('GET /key', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve(KeyRepository);
        vi.spyOn(repo, 'getLatestKeys').mockRejectedValue(new Error());

        const res = await requestSender.getLastestKeys();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('POST /key', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve(KeyRepository);
        vi.spyOn(repo, 'getMaxVersionWithLock').mockRejectedValue(new Error());
        const [privateKey, publicKey] = getMockKeys();

        const res = await requestSender.upsertKey({ requestBody: { environment: Environment.NP, version: 1, privateKey, publicKey } });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });

      describe('GET /key/:environment', function () {
        it('should return 500 status code if db throws an error', async function () {
          vi.spyOn(drizzle.query.key, 'findMany').mockRejectedValue(new Error());

          const res = await requestSender.getKeys({ pathParams: { environment: Environment.NP } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });

      describe('GET /key/:environment/:version', function () {
        it('should return 500 status code if db throws an error', async function () {
          vi.spyOn(drizzle.query.key, 'findFirst').mockRejectedValue(new Error());

          const res = await requestSender.getSpecificKey({ pathParams: { environment: Environment.NP, version: 1 } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });

      describe('GET /key/:environment/latest', () => {
        it('should return 500 status code if db throws an error', async function () {
          const repo = depContainer.resolve(KeyRepository);
          vi.spyOn(repo, 'getMaxVersion').mockRejectedValue(new Error());

          const res = await requestSender.getLatestKey({ pathParams: { environment: Environment.NP } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });
    });
  });
});
