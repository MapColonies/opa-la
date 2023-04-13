import { Environment, IKey } from '@map-colonies/auth-core';
import * as supertest from 'supertest';

export class KeyRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getLatestKeys(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/key').set('Content-Type', 'application/json');
  }

  public async getKeys(environment: Environment): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/key/${environment}`).set('Content-Type', 'application/json');
  }

  public async getKey(environment: Environment, version: number): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/key/${environment}/${version}`).set('Content-Type', 'application/json');
  }

  public async upsertKey(key: IKey): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .post('/key')
      .set('Content-Type', 'application/json')
      .send(key as object);
  }
}
