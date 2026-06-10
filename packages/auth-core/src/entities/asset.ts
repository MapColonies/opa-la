import { boolean, bytea, integer, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { authManagerSchema, createdAtColumn, environmentEnum } from './common';

type AssetTypeEnumValues = typeof assetTypeEnum.enumValues;

export const assetTypeEnum = authManagerSchema.enum('asset_type_enum', ['TEST', 'TEST_DATA', 'POLICY', 'DATA']);

export const assetTable = authManagerSchema.table(
  'asset',
  {
    name: varchar().notNull(),
    version: integer().notNull(),
    createdAt: createdAtColumn,
    value: bytea().notNull(),
    uri: varchar().notNull(),
    type: assetTypeEnum().notNull(),
    environment: environmentEnum().array().notNull(),
    isTemplate: boolean().notNull(),
  },
  (table) => [primaryKey({ columns: [table.name, table.version], name: 'PK_c3670311f777dc6ab9965408f97' })]
);

/* eslint-disable @typescript-eslint/naming-convention */
export const AssetType: { [K in AssetTypeEnumValues[number]]: K } = {
  /** OPA test files. */
  TEST: 'TEST',
  TEST_DATA: 'TEST_DATA',
  /** OPA policy files. */
  POLICY: 'POLICY',
  /** OPA data files, name should end with .json or .yaml. */
  DATA: 'DATA',
} as const;

export type Asset = typeof assetTable.$inferSelect;
export type NewAsset = typeof assetTable.$inferInsert;
