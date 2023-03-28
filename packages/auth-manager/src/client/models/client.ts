import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface PointOfContact {
  name: string;
  phone: string;
  email: string;
}

export interface IClient {
  name: string;
  hebName: string;
  description?: string;
  branch?: string;
  createdAt?: Date;
  updatedAt?: Date;
  techPointOfContact?: PointOfContact;
  productPointOfContact?: PointOfContact;
  tags?: string[];
}

@Entity()
export class Client implements IClient {
  @PrimaryColumn({ name: 'name', type: 'text', unique: true })
  public name!: string;

  @Column({ type: 'text', name: 'heb_name' })
  public hebName!: string;

  @Column({ type: 'text', nullable: true })
  public description?: string;

  @Column({ type: 'text', nullable: true })
  public branch?: string;

  @CreateDateColumn({ name: 'created_at' })
  public createdAt?: Date;

  @UpdateDateColumn({ name: 'update_at' })
  public updatedAt?: Date;

  @Column({ type: 'json', name: 'tech_point_of_contact', nullable: true })
  public techPointOfContact?: PointOfContact;

  @Column({ type: 'json', name: 'product_point_of_contact', nullable: true })
  public productPointOfContact?: PointOfContact;

  @Column({ type: 'text', array: true, nullable: true })
  public tags?: string[] | undefined;
}
