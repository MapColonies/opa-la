import { text } from 'drizzle-orm/pg-core';
import { authManagerSchema } from './common';

export const domainTable = authManagerSchema.table('domain', {
  name: text().primaryKey(),
});

export type Domain = typeof domainTable.$inferSelect;
export type NewDomain = typeof domainTable.$inferInsert;
