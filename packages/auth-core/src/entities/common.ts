import * as d from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';

type EnvironmentValues = typeof environmentEnum.enumValues;

export const authManagerSchema = d.snakeCase.schema('auth_manager');
export const environmentEnum = authManagerSchema.enum('environment_enum', ['np', 'stage', 'prod']);

export const createdAtColumn = timestamp({ withTimezone: true }).defaultNow().notNull();

/* eslint-disable @typescript-eslint/naming-convention */
export const Environment: { [K in EnvironmentValues[number] as Uppercase<K>]: K } = {
  /** Non production, may also be called dev. */
  NP: 'np',
  /** The staging environment, may also be called integration. */
  STAGE: 'stage',
  /** The production environment. */
  PROD: 'prod',
} as const;
/* eslint-enable @typescript-eslint/naming-convention */
export type Environments = (typeof environmentEnum.enumValues)[number];
