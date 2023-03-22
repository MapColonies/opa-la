import { Entity, PrimaryColumn } from 'typeorm';

export interface IDomain {
  name: string;
}

@Entity()
export class Domain implements IDomain {
  @PrimaryColumn({ name: 'name', type: 'text', unique: true })
  public name!: string;
}
