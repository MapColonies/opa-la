import { Environment, IConnection } from '@map-colonies/auth-core';
import * as supertest from 'supertest';
import { ConnectionSearchParams } from '../../../../src/connection/models/connection';

export class ConnectionRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getConnections(params?: ConnectionSearchParams): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .get('/connection')
      .set('Content-Type', 'application/json')
      .query(params ?? {});
  }

  public async getNamedConnections(clientName: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/client/${clientName}/connection`).set('Content-Type', 'application/json');
  }

  public async getNamedEnvConnections(clientName: string, environment: Environment): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/client/${clientName}/connection/${environment}`).set('Content-Type', 'application/json');
  }

  public async getConnection(clientName: string, environment: Environment, version: number): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/client/${clientName}/connection/${environment}/${version}`).set('Content-Type', 'application/json');
  }

  public async upsertConnection(connection: IConnection, shouldIgnoreTokenErrors = false): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .post('/connection')
      .query({ shouldIgnoreTokenErrors })
      .set('Content-Type', 'application/json')
      .send(connection as object);
  }
}
