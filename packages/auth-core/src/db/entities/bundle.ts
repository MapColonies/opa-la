import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { Environment, type Environments, IBundle } from '../../model';

/**
 * The typeorm implementation of the IBundle interface.
 */
@Entity()
export class Bundle implements IBundle {
  @PrimaryColumn({ generated: 'identity', generatedIdentity: 'ALWAYS', insert: false })
  public id!: number;

  @Column({ type: 'text', nullable: true })
  public hash?: string;

  @Column({ type: 'enum', enum: Environment, enumName: 'environment_enum' })
  public environment!: Environments;

  @Column({ type: 'jsonb', nullable: true })
  public metadata?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  public assets?: { name: string; version: number }[];

  @Column({ type: 'jsonb', nullable: true })
  public connections?: { name: string; version: number }[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  public createdAt?: Date;

  @Column({ name: 'key_version', type: 'integer', nullable: true })
  public keyVersion?: number;

  @Column({ name: 'opa_version', type: 'text', nullable: false })
  public opaVersion!: string;
}
