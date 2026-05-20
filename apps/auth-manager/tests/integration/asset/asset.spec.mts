/// <reference types="jest-extended" />
import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest';
import httpStatusCodes from 'http-status-codes';
import type { DependencyContainer } from 'tsyringe';
import 'jest-openapi';
import { type Asset, assetTable, AssetType, type Drizzle, Environment, type NewAsset } from '@map-colonies/auth-core';
import { faker } from '@faker-js/faker';
import type { RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { getFakeAsset } from 'test-utils';
import type { paths, operations } from 'auth-openapi';
import { AssetRepository } from '@src/asset/DAL/assetRepository.js';
import { initEnvironment } from '../setup.js';

describe('client', function () {
  let requestSender: RequestSender<paths, operations>;
  let depContainer: DependencyContainer;
  let drizzle: Drizzle;

  beforeAll(async function () {
    const env = await initEnvironment();
    depContainer = env.container;
    requestSender = env.requestSender;
    drizzle = env.drizzle;
  });

  // afterAll(async function () {
  //   await depContainer.resolve(Pool).end();
  // });

  describe('Happy Path', function () {
    describe('GET /assets', function () {
      it('should return 200 status code and all the assets', async function () {
        const asset = getFakeAsset();
        asset.environment = [Environment.PROD];
        const assets: NewAsset[] = [
          asset,
          { ...asset, version: 2 },
          { ...asset, name: faker.string.sample(9), environment: [Environment.NP, Environment.STAGE] },
        ];

        await drizzle.insert(assetTable).values(assets).execute();

        const res = await requestSender.getAssets();

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toIncludeAllPartialMembers(assets.map((a) => delete a.createdAt));
      });

      it('should return 200 status code and all the assets with specific env', async function () {
        const asset = getFakeAsset();
        asset.environment = [Environment.PROD];
        const assets: NewAsset[] = [
          asset,
          { ...asset, version: 2 },
          { ...asset, name: faker.string.sample(9), environment: [Environment.NP, Environment.STAGE] },
        ];

        await drizzle.insert(assetTable).values(assets).execute();

        const res = await requestSender.getAssets({ queryParams: { environment: ['prod'] } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((a: Asset) => a.environment.includes(Environment.PROD));
      });

      it('should return 200 status code and all the assets with specific type', async function () {
        const asset = getFakeAsset();
        asset.type = AssetType.DATA;
        const assets: NewAsset[] = [
          { ...asset, name: faker.string.sample(9) },
          { ...asset, type: AssetType.POLICY },
        ];

        await drizzle.insert(assetTable).values(assets).execute();

        const res = await requestSender.getAssets({ queryParams: { type: AssetType.DATA } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((a: Asset) => a.type === AssetType.DATA);
      });
    });

    describe('POST /asset', function () {
      it('should return 201 status code and the created asset', async function () {
        const asset = getFakeAsset();

        const res = await requestSender.upsertAsset({ requestBody: { ...asset, value: asset.value.toString('base64') } });

        delete asset.createdAt;

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ ...asset, value: asset.value.toString('base64') });
      });

      it('should return 200 status code and the updated asset', async function () {
        const asset = getFakeAsset();
        await drizzle.insert(assetTable).values(asset).execute();

        delete asset.createdAt;

        const res = await requestSender.upsertAsset({ requestBody: { ...asset, value: asset.value.toString('base64') } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ ...asset, version: 2, value: asset.value.toString('base64') });
      });
    });

    describe('GET /asset/:name', function () {
      it('should return 200 status code all the assets with the specific name', async function () {
        const asset = getFakeAsset();
        const assets: NewAsset[] = [asset, { ...asset, version: 2 }];

        await drizzle.insert(assetTable).values(assets).execute();

        const res = await requestSender.getAsset({ pathParams: { assetName: asset.name } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((a: NewAsset) => a.name === asset.name);
      });
    });

    describe('GET /asset/:name/:version', function () {
      it('should return 200 status code and the requested asset', async function () {
        const asset = getFakeAsset();
        await drizzle.insert(assetTable).values(asset).execute();

        const res = await requestSender.getVersionedAsset({ pathParams: { assetName: asset.name, version: asset.version } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(res.body).toStrictEqual({ ...asset, value: asset.value.toString('base64'), createdAt: expect.any(String) });
      });
    });

    describe('GET /asset/:name/latest', function () {
      it('should return 200 status code and the latest asset when multiple versions exist', async function () {
        const baseAsset = getFakeAsset();
        const assets: NewAsset[] = [baseAsset, { ...baseAsset, version: 2 }, { ...baseAsset, version: 3 }];

        await drizzle.insert(assetTable).values(assets).execute();

        const expectedAsset = assets.find((a) => a.version === 3);

        const res = await requestSender.getLatestAsset({ pathParams: { assetName: baseAsset.name } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(res.body).toStrictEqual({ ...expectedAsset, value: expectedAsset!.value.toString('base64'), createdAt: expect.any(String) });
      });

      it('should return 200 status code and the only asset when there is only one version', async function () {
        const asset = getFakeAsset();
        await drizzle.insert(assetTable).values(asset).execute();

        const res = await requestSender.getLatestAsset({ pathParams: { assetName: asset.name } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(res.body).toStrictEqual({ ...asset, createdAt: expect.any(String), value: asset.value.toString('base64') });
      });
    });
  });

  describe('Bad Path', function () {
    describe('POST /asset', function () {
      it('should return 400 if the request body is incorrect', async function () {
        const { version, ...asset } = getFakeAsset();
        const res = await requestSender.upsertAsset({
          requestBody: {
            ...asset,
            value: asset.value.toString('base64'),
          } as unknown as paths['/asset']['post']['requestBody']['content']['application/json'],
        });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the request version doesn't match the DB version", async function () {
        const asset = getFakeAsset();
        await drizzle
          .insert(assetTable)
          .values({ ...asset })
          .execute();

        const res = await requestSender.upsertAsset({ requestBody: { ...asset, value: asset.value.toString('base64'), version: 2 } });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the no asset exists and request version isn't 1", async function () {
        const res = await requestSender.upsertAsset({
          requestBody: { ...getFakeAsset(), value: getFakeAsset().value.toString('base64'), version: 2 },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /asset/:name', function () {
      it('should return 400 if name value is not valid', async function () {
        const res = await requestSender.getAsset({ pathParams: { assetName: 'AI' } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /asset/:name/:version', function () {
      it('should return 400 if version value is not valid', async function () {
        const res = await requestSender.getVersionedAsset({ pathParams: { assetName: 'avi', version: -1 } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 404 if the asset doesn't exist", async function () {
        const res = await requestSender.getVersionedAsset({ pathParams: { assetName: 'avi', version: 999 } });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /asset/:name/latest', function () {
      it('should return 400 if assetName value is not valid', async function () {
        const res = await requestSender.getLatestAsset({ pathParams: { assetName: 'AI' } });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it('should return 404 if no asset exists with the given name', async function () {
        const res = await requestSender.getLatestAsset({ pathParams: { assetName: 'nonexistent' } });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });
  });

  describe('Sad Path', function () {
    afterEach(function () {
      vi.restoreAllMocks();
    });

    describe('GET /asset', function () {
      it('should return 500 status code if db throws an error', async function () {
        // const repo = depContainer.resolve<AssetRepository>(SERVICES.ASSET_REPOSITORY);
        // vi.spyOn(repo, 'findBy').mockRejectedValue(new Error());
        vi.spyOn(drizzle.query.asset, 'findMany').mockRejectedValue(new Error());

        const res = await requestSender.getAssets();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('POST /asset', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve(AssetRepository);
        vi.spyOn(repo, 'getMaxVersionWithLock').mockRejectedValue(new Error());
        const asset = getFakeAsset();

        const res = await requestSender.upsertAsset({ requestBody: { ...asset, value: asset.value.toString('base64') } });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });

      describe('GET /asset/:name', function () {
        it('should return 500 status code if db throws an error', async function () {
          // const repo = depContainer.resolve<AssetRepository>(SERVICES.ASSET_REPOSITORY);
          // vi.spyOn(repo, 'findBy').mockRejectedValue(new Error());
          vi.spyOn(drizzle.query.asset, 'findMany').mockRejectedValue(new Error());

          const res = await requestSender.getAsset({ pathParams: { assetName: 'avi' } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });

      describe('GET /asset/:name/:version', function () {
        it('should return 500 status code if db throws an error', async function () {
          // const repo = depContainer.resolve<AssetRepository>(SERVICES.ASSET_REPOSITORY);
          // vi.spyOn(repo, 'findOne').mockRejectedValue(new Error());
          vi.spyOn(drizzle.query.asset, 'findFirst').mockRejectedValue(new Error());

          const res = await requestSender.getVersionedAsset({ pathParams: { assetName: 'avi', version: 1 } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });

      describe('GET /asset/:name/latest', function () {
        it('should return 500 status code if db throws an error', async function () {
          const repo = depContainer.resolve(AssetRepository);
          vi.spyOn(repo, 'getMaxVersion').mockRejectedValue(new Error());

          const res = await requestSender.getLatestAsset({ pathParams: { assetName: 'avi' } });

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });
    });
  });
});
