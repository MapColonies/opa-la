import supertest from 'supertest';
import { Application } from 'express';

export class DocsRequestSender {
  public constructor(private readonly app: Application) {}

  public async getDocs(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/docs/api/');
  }

  public async getDocsJson(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/docs/api.json');
  }
}
