// import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
// import type { IClient, PointOfContact } from '../../model';

import { json, text, timestamp } from 'drizzle-orm/pg-core';
import { authManagerSchema, createdAtColumn } from './common';
import { PointOfContact } from '../../model';

// /**
//  * The typeorm implementation of the IClient interface.
//  */
// @Entity()
// export class Client implements IClient {
//   @PrimaryColumn({ name: 'name', type: 'text', unique: true })
//   public name!: string;

//   @Column({ type: 'text', name: 'heb_name' })
//   public hebName!: string;

//   @Column({ type: 'text', nullable: true })
//   public description?: string;

//   @Column({ type: 'text', nullable: true })
//   public branch?: string;

//   @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
//   public createdAt?: Date;

//   @UpdateDateColumn({ name: 'update_at', type: 'timestamptz' })
//   public updatedAt?: Date;

//   @Column({ type: 'json', name: 'tech_point_of_contact', nullable: true })
//   public techPointOfContact?: PointOfContact;

//   @Column({ type: 'json', name: 'product_point_of_contact', nullable: true })
//   public productPointOfContact?: PointOfContact;

//   @Column({ type: 'text', array: true, nullable: true })
//   public tags?: string[] | undefined;
// }

export const clientTable = authManagerSchema.table('client', {
  name: text().primaryKey(),
  hebName: text().notNull(),
  description: text(),
  branch: text(),
  createdAt: createdAtColumn,
  updateAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  techPointOfContact: json('tech_point_of_contact').$type<PointOfContact>(),
  productPointOfContact: json('product_point_of_contact').$type<PointOfContact>(),
  tags: text().array(),
});

export type Client = typeof clientTable.$inferSelect;
export type NewClient = typeof clientTable.$inferInsert;
