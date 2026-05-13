import { defineRelations } from 'drizzle-orm';

import { assetTable } from './asset';
import { bundleTable } from './bundle';
import { clientTable } from './client';
import { connectionTable } from './connection';
import { domainTable } from './domain';
import { keyTable } from './key';

export const relations = defineRelations({
  asset: assetTable,
  bundle: bundleTable,
  client: clientTable,
  connection: connectionTable,
  domain: domainTable,
  key: keyTable,
});

export * from './asset';
export * from './bundle';
export * from './client';
export * from './connection';
export * from './domain';
export * from './key';
export * from './common';
