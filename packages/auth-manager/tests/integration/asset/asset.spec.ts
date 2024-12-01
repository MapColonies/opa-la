/// <reference types="jest-extended" />
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import 'jest-openapi';
import { DataSource } from 'typeorm';
import { Asset, AssetType, Environment, IAsset } from '@map-colonies/auth-core';
import { faker } from '@faker-js/faker';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { AssetRepository } from '../../../src/asset/DAL/assetRepository';
import { getFakeAsset } from '../../utils/asset';
import { initConfig } from '../../../src/common/config';
import { AssetRequestSender } from './helpers/requestSender';

describe('client', function () {
  let requestSender: AssetRequestSender;
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
    requestSender = new AssetRequestSender(app);
    depContainer = container;
  });

  afterEach(async function () {
    await depContainer.resolve(DataSource).destroy();
  });

  describe('Happy Path', function () {
    describe('GET /assets', function () {
      it('should return 200 status code and all the assets', async function () {
        const asset = getFakeAsset();
        asset.environment = [Environment.PRODUCTION];
        const assets: IAsset[] = [
          asset,
          { ...asset, version: 2 },
          { ...asset, name: faker.random.alphaNumeric(9), environment: [Environment.NP, Environment.STAGE] },
        ];

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Asset).save(assets);

        const res = await requestSender.getAssets();

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toIncludeAllPartialMembers(assets.map((a) => delete a.createdAt));
      });

      it('should return 200 status code and all the assets with specific env', async function () {
        const asset = getFakeAsset();
        asset.environment = [Environment.PRODUCTION];
        const assets: IAsset[] = [
          asset,
          { ...asset, version: 2 },
          { ...asset, name: faker.random.alphaNumeric(9), environment: [Environment.NP, Environment.STAGE] },
        ];

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Asset).save(assets);

        const res = await requestSender.getAssets({ environment: [Environment.PRODUCTION] });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((a: IAsset) => a.environment.includes(Environment.PRODUCTION));
      });

      it('should return 200 status code and all the assets with specific type', async function () {
        const asset = getFakeAsset();
        asset.type = AssetType.DATA;
        const assets: IAsset[] = [
          { ...asset, name: faker.random.alphaNumeric(9) },
          { ...asset, type: AssetType.POLICY },
        ];

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Asset).save(assets);

        const res = await requestSender.getAssets({ type: AssetType.DATA });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((a: IAsset) => a.type === AssetType.DATA);
      });
    });

    describe('POST /asset', function () {
      it('should return 201 status code and the created asset', async function () {
        const asset = getFakeAsset();

        const res = await requestSender.upsertAsset(asset);

        delete asset.createdAt;

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(asset);
      });

      it('should return 200 status code and the updated asset', async function () {
        const asset = getFakeAsset();
        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Asset).save(asset);

        delete asset.createdAt;

        const res = await requestSender.upsertAsset(asset);

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ ...asset, version: 2 });
      });
    });

    describe('GET /asset/:name', function () {
      it('should return 200 status code all the assets with the specific name', async function () {
        const asset = getFakeAsset();
        const assets: IAsset[] = [asset, { ...asset, version: 2 }];

        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Asset).save(assets);

        const res = await requestSender.getNamedAssets(asset.name);

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toSatisfyAll((a: IAsset) => a.name === asset.name);
      });
    });

    describe('GET /asset/:name/:version', function () {
      it('should return 200 status code and the requested asset', async function () {
        const asset = getFakeAsset();
        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Asset).save(asset);

        const res = await requestSender.getAsset(asset.name, asset.version);

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ ...asset, createdAt: asset.createdAt?.toISOString() });
      });
    });
  });

  describe('Bad Path', function () {
    describe('POST /asset', function () {
      it('should return 400 if the request body is incorrect', async function () {
        const { version, ...asset } = getFakeAsset();
        const res = await requestSender.upsertAsset(asset as IAsset);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the request version doesn't match the DB version", async function () {
        const asset = getFakeAsset();
        const connection = depContainer.resolve(DataSource);
        await connection.getRepository(Asset).save({ ...asset });

        const res = await requestSender.upsertAsset({ ...asset, version: 2 });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 409 if the no asset exists and request version isn't 1", async function () {
        const res = await requestSender.upsertAsset({ ...getFakeAsset(), version: 2 });

        expect(res).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /asset/:name', function () {
      it('should return 400 if name value is not valid', async function () {
        const res = await requestSender.getNamedAssets('ai');

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /asset/:name/:version', function () {
      it('should return 400 if version value is not valid', async function () {
        const res = await requestSender.getAsset('avi', -1);

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
      });

      it("should return 404 if the asset doesn't exist", async function () {
        const res = await requestSender.getAsset('avi', 999);

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
      });
    });
  });

  describe('Sad Path', function () {
    afterEach(function () {
      jest.restoreAllMocks();
    });

    describe('GET /asset', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<AssetRepository>(SERVICES.ASSET_REPOSITORY);
        jest.spyOn(repo, 'findBy').mockRejectedValue(new Error());

        const res = await requestSender.getAssets();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
    describe('POST /asset', function () {
      it('should return 500 status code if db throws an error', async function () {
        const repo = depContainer.resolve<AssetRepository>(SERVICES.ASSET_REPOSITORY);
        jest.spyOn(repo, 'getMaxVersionWithLock').mockRejectedValue(new Error());
        const asset = getFakeAsset();

        const res = await requestSender.upsertAsset(asset);

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });

      describe('GET /asset/:name', function () {
        it('should return 500 status code if db throws an error', async function () {
          const repo = depContainer.resolve<AssetRepository>(SERVICES.ASSET_REPOSITORY);
          jest.spyOn(repo, 'findBy').mockRejectedValue(new Error());

          const res = await requestSender.getNamedAssets('avi');

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });

      describe('GET /asset/:name/:version', function () {
        it('should return 500 status code if db throws an error', async function () {
          const repo = depContainer.resolve<AssetRepository>(SERVICES.ASSET_REPOSITORY);
          jest.spyOn(repo, 'findOne').mockRejectedValue(new Error());

          const res = await requestSender.getAsset('avi', 1);

          expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
          expect(res).toSatisfyApiSpec();
        });
      });
    });
  });
});
