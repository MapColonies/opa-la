import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export type DbConfig = {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
} & PostgresConnectionOptions;

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}
