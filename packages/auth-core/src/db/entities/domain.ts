import { Entity, PrimaryColumn } from 'typeorm';
import { IDomain } from '../../model';

@Entity()
export class Domain implements IDomain {
  @PrimaryColumn({ name: 'name', type: 'text', unique: true })
  public name!: string;
}
