import { boolean, integer, primaryKey, text, varchar } from 'drizzle-orm/pg-core';
import { authManagerSchema, createdAtColumn, environmentEnum } from './common';

export const connectionTable = authManagerSchema.table(
  'connection',
  {
    name: varchar().notNull(),
    version: integer().notNull(),
    environment: environmentEnum().notNull(),
    enabled: boolean().notNull(),
    token: text().notNull(),
    allowNoBrowserConnection: boolean('allow_no_browser').notNull(),
    allowNoOriginConnection: boolean('allow_no_origin').notNull(),
    domains: text().array().notNull(),
    origins: text().array().notNull(),
    createdAt: createdAtColumn,
  },
  (table) => [primaryKey({ columns: [table.name, table.version, table.environment], name: 'PK_4c3be048a366c9ce9277bac4c38' })]
);

export type Connection = typeof connectionTable.$inferSelect;
export type NewConnection = typeof connectionTable.$inferInsert;
