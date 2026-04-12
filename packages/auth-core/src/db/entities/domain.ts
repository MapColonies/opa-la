import { Entity, PrimaryColumn } from 'typeorm';
import type { IDomain } from '../../model';

/**
 * The typeorm implementation of the IDomain interface.
 */
@Entity()
export class Domain implements IDomain {
  @PrimaryColumn({ name: 'name', type: 'text', unique: true })
  public name!: string;
}
