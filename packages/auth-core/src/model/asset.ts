import { Environment } from './common';

export enum AssetType {
  TEST = 'TEST',
  TEST_DATA = 'TEST_DATA',
  POLICY = 'POLICY',
  DATA = 'DATA',
}

export interface IAsset {
  name: string;
  version: number;
  createdAt?: Date;
  value: string;
  uri: string;
  type: AssetType;
  environment: Environment[];
  isTemplate: boolean;
}
