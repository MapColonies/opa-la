import { Environment } from './common';

export interface IBundle {
  id?: number;
  environment: Environment;
  hash?: string;
  metadata?: Record<string, unknown>;
  assets?: { name: string; version: number }[];
  connections?: { name: string; version: number }[];
  createdAt?: Date;
  keyVersion?: number;
}
