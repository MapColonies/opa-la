import { integer, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { authManagerSchema, environmentEnum } from './common';

/**
 * JSON representation of a public key
 */
export interface JWKPublicKey {
  kty: string;
  n: string;
  e: string;
  alg: string;
  kid: string;
}

/**
 * JSON representation of a private key
 */
export interface JWKPrivateKey extends JWKPublicKey {
  d: string;
  p: string;
  q: string;
  dp: string;
  dq: string;
  qi: string;
}

export const keyTable = authManagerSchema.table(
  'key',
  {
    environment: environmentEnum().notNull(),
    version: integer().notNull(),
    privateKey: jsonb().notNull().$type<JWKPrivateKey>(),
    publicKey: jsonb().notNull().$type<JWKPublicKey>(),
  },
  (table) => [primaryKey({ columns: [table.environment, table.version], name: 'PK_ddf3d991c46b66651794ee56d58' })]
);

export type Key = typeof keyTable.$inferSelect;
export type NewKey = typeof keyTable.$inferInsert;
