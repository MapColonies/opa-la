import { IDomain } from '@map-colonies/auth-core';
import * as supertest from 'supertest';

export class DomainRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getDomains(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/domain').set('Content-Type', 'application/json');
  }

  public async createDomain(domain: IDomain): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .post('/domain')
      .set('Content-Type', 'application/json')
      .send(domain as object);
  }
}
