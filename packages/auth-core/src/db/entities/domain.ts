// import { Entity, PrimaryColumn } from 'typeorm';
// import type { IDomain } from '../../model';

import { text } from 'drizzle-orm/pg-core';
import { authManagerSchema } from './common';

// /**
//  * The typeorm implementation of the IDomain interface.
//  */
// @Entity()
// export class Domain implements IDomain {
//   @PrimaryColumn({ name: 'name', type: 'text', unique: true })
//   public name!: string;
// }

export const domainTable = authManagerSchema.table('domain', {
  name: text().primaryKey(),
});

export type Domain = typeof domainTable.$inferSelect;
export type NewDomain = typeof domainTable.$inferInsert;
