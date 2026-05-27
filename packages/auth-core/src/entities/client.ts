import { json, text, timestamp } from 'drizzle-orm/pg-core';
import { authManagerSchema, createdAtColumn } from './common';

export interface PointOfContact {
  /** The full name. */
  name: string;
  phone: string;
  email: string;
}

export const clientTable = authManagerSchema.table('client', {
  name: text().primaryKey(),
  hebName: text().notNull(),
  description: text(),
  branch: text(),
  createdAt: createdAtColumn,
  updatedAt: timestamp('update_at', { withTimezone: true }).defaultNow().notNull(),
  techPointOfContact: json('tech_point_of_contact').$type<PointOfContact>(),
  productPointOfContact: json('product_point_of_contact').$type<PointOfContact>(),
  tags: text().array(),
});

export type Client = typeof clientTable.$inferSelect;
export type NewClient = typeof clientTable.$inferInsert;
