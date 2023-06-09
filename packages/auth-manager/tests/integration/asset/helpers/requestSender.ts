import { IAsset } from '@map-colonies/auth-core';
import * as supertest from 'supertest';
import { AssetSearchParams } from '../../../../src/asset/models/asset';

export class AssetRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getAssets(params?: AssetSearchParams): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .get('/asset')
      .set('Content-Type', 'application/json')
      .query(params ?? {});
  }

  public async getNamedAssets(name: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/asset/${name}`).set('Content-Type', 'application/json');
  }

  public async getAsset(name: string, version: number): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/asset/${name}/${version}`).set('Content-Type', 'application/json');
  }

  public async upsertAsset(asset: IAsset): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .post('/asset')
      .set('Content-Type', 'application/json')
      .send(asset as object);
  }
}
