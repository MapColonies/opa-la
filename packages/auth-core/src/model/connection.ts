import { Environment } from './common';

export interface IConnection {
  name: string;
  version: number;
  environment: Environment;
  createdAt?: Date;
  enabled: boolean;
  token: string;
  allowNoBrowserConnection: boolean;
  allowNoOriginConnection: boolean;
  domains: string[];
  origins: string[];
}
