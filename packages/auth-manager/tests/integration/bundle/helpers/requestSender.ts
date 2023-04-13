import * as supertest from 'supertest';
import { BundleSearchParams } from '../../../../src/bundle/models/bundle';

export class BundleRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getBundles(params?: BundleSearchParams): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .get('/bundle')
      .set('Content-Type', 'application/json')
      .query(params ?? {});
  }

  public async getBundle(id: number): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/bundle/${id}`).set('Content-Type', 'application/json');
  }
}
