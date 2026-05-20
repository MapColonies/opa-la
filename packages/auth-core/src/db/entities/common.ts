import * as d from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';

export const authManagerSchema = d.snakeCase.schema('auth_manager');
export const environmentEnum = authManagerSchema.enum('environment_enum', ['np', 'stage', 'prod']);

export const createdAtColumn = timestamp({ withTimezone: true }).defaultNow().notNull();

export type Environments = (typeof environmentEnum.enumValues)[number];
