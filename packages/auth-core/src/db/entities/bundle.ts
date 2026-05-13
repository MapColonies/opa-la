// import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
// import { Environment, type Environments, type IBundle } from '../../model';

import { integer, jsonb, text, timestamp } from 'drizzle-orm/pg-core';
import { authManagerSchema, createdAtColumn, environmentEnum } from './common';

// /**
//  * The typeorm implementation of the IBundle interface.
//  */
// @Entity()
// export class Bundle implements IBundle {
//   @PrimaryColumn({ generated: 'identity', generatedIdentity: 'ALWAYS', insert: false, type: 'integer' })
//   public id!: number;

//   @Column({ type: 'text', nullable: true })
//   public hash?: string;

//   @Column({ type: 'enum', enum: Environment, enumName: 'environment_enum' })
//   public environment!: Environments;

//   @Column({ type: 'jsonb', nullable: true })
//   public metadata?: Record<string, unknown>;

//   @Column({ type: 'jsonb', nullable: true })
//   public assets?: { name: string; version: number }[];

//   @Column({ type: 'jsonb', nullable: true })
//   public connections?: { name: string; version: number }[];

//   @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
//   public createdAt?: Date;

//   @Column({ name: 'key_version', type: 'integer', nullable: true })
//   public keyVersion?: number;

//   @Column({ name: 'opa_version', type: 'text', nullable: false })
//   public opaVersion!: string;
// }

export const bundleTable = authManagerSchema.table('bundle', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  hash: text(),
  environment: environmentEnum().notNull(),
  metadata: jsonb(),
  assets: jsonb(),
  connections: jsonb(),
  createdAt: createdAtColumn,
  keyVersion: integer(),
  opaVersion: text().notNull(),
});

export type Bundle = typeof bundleTable.$inferSelect;
export type NewBundle = typeof bundleTable.$inferInsert;
