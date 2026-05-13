// import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
// import { Environment, type IConnection, type Environments } from '../../model';

import { boolean, integer, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { authManagerSchema, createdAtColumn, environmentEnum } from './common';

// /**
//  * The typeorm implementation of the IConnection interface.
//  */
// @Entity()
// export class Connection implements IConnection {
//   @PrimaryColumn({ type: 'varchar' })
//   public name!: string;

//   @PrimaryColumn({ type: 'integer' })
//   public version!: number;

//   @PrimaryColumn({ type: 'enum', enum: Environment, enumName: 'environment_enum' })
//   public environment!: Environments;

//   @Column({ type: 'boolean' })
//   public enabled!: boolean;

//   @Column({ type: 'text' })
//   public token!: string;

//   @Column({ type: 'boolean', name: 'allow_no_browser' })
//   public allowNoBrowserConnection!: boolean;

//   @Column({ type: 'boolean', name: 'allow_no_origin' })
//   public allowNoOriginConnection!: boolean;

//   @Column({ type: 'text', array: true })
//   public domains!: string[];

//   @Column({ type: 'text', array: true })
//   public origins!: string[];

//   @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
//   public createdAt!: Date;
// }

export const connectionTable = authManagerSchema.table(
  'connection',
  {
    name: varchar().notNull(),
    version: integer().notNull(),
    environment: environmentEnum().notNull(),
    enabled: boolean().notNull(),
    token: text().notNull(),
    allowNoBrowser: boolean().notNull(),
    allowNoOrigin: boolean().notNull(),
    domains: text().array().notNull(),
    origins: text().array().notNull(),
    createdAt: createdAtColumn,
  },
  (table) => [primaryKey({ columns: [table.name, table.version, table.environment], name: 'PK_4c3be048a366c9ce9277bac4c38' })]
);

export type Connection = typeof connectionTable.$inferSelect;
export type NewConnection = typeof connectionTable.$inferInsert;
