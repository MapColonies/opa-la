// import { Column, Entity, PrimaryColumn } from 'typeorm';
// import { Environment, type Environments, type IKey, type JWKPrivateKey, type JWKPublicKey } from '../../model';

import { integer, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { authManagerSchema, environmentEnum } from './common';

// /**
//  * The typeorm implementation of the IKey interface.
//  */
// @Entity()
// export class Key implements IKey {
//   @PrimaryColumn({ type: 'enum', enum: Environment, unique: true, enumName: 'environment_enum' })
//   public environment!: Environments;

//   @PrimaryColumn({ type: 'integer' })
//   public version!: number;

//   @Column({ type: 'jsonb', name: 'private_key' })
//   public privateKey!: JWKPrivateKey;

//   @Column({ type: 'jsonb', name: 'public_key' })
//   public publicKey!: JWKPublicKey;
// }

export const keyTable = authManagerSchema.table(
  'key',
  {
    environment: environmentEnum().notNull(),
    version: integer().notNull(),
    privateKey: jsonb().notNull(),
    publicKey: jsonb().notNull(),
  },
  (table) => [primaryKey({ columns: [table.environment, table.version], name: 'PK_ddf3d991c46b66651794ee56d58' })]
);

export type Key = typeof keyTable.$inferSelect;
export type NewKey = typeof keyTable.$inferInsert;
