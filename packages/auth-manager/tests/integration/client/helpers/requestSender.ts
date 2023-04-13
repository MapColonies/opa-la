import { IClient } from '@map-colonies/auth-core';
import * as supertest from 'supertest';
import { ClientSearchParams } from '../../../../src/client/models/client';

export class ClientRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getClients(params?: ClientSearchParams): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .get('/client')
      .set('Content-Type', 'application/json')
      .query(params ?? {});
  }

  public async getClient(name: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/client/${name}`).set('Content-Type', 'application/json');
  }

  public async updateClient(name: string, client: Omit<IClient, 'name' | 'createdAt' | 'updatedAt'>): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .patch(`/client/${name}`)
      .set('Content-Type', 'application/json')
      .send(client as object);
  }

  public async createClient(client: IClient): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .post('/client')
      .set('Content-Type', 'application/json')
      .send(client as object);
  }
}
