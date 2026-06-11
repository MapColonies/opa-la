import { integer, jsonb, text } from 'drizzle-orm/pg-core';
import { authManagerSchema, createdAtColumn, environmentEnum } from './common';

export const bundleTable = authManagerSchema.table('bundle', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  hash: text(),
  environment: environmentEnum().notNull(),
  metadata: jsonb().$type<Record<string, unknown>>(),
  assets: jsonb().$type<{ name: string; version: number }[]>(),
  connections: jsonb().$type<{ name: string; version: number }[]>(),
  createdAt: createdAtColumn,
  keyVersion: integer(),
  opaVersion: text().notNull(),
  revision: text().notNull(),
});

export type Bundle = typeof bundleTable.$inferSelect;
export type NewBundle = typeof bundleTable.$inferInsert;
