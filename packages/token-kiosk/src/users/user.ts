import { integer, jsonb, pgSchema, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const pgDbSchema = pgSchema('token_kiosk');

export const users = pgDbSchema.table('users', {
  id: text('id').primaryKey().notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastRequestedAt: timestamp('last_requested_at', { withTimezone: true }).notNull().defaultNow(),
  token: text('token').notNull(),
  tokenCreationDate: timestamp('token_creation_date', { withTimezone: true }).notNull().defaultNow(),
  tokenExpirationDate: timestamp('token_expiration_date', { withTimezone: true }).notNull(),
  tokenCreationCount: integer('token_creation_count').notNull().default(0),
  isBanned: boolean('is_banned').notNull().default(false),
});

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
