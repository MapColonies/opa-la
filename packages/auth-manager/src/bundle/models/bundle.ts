import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { Environment } from '../../common/constants';

export interface IBundle {
  id?: number;
  environment: Environment;
  hash?: string;
  metadata?: Record<string, unknown>;
  assets?: { name: string; version: number }[];
  connections?: { name: string; version: number }[];
  createdAt?: Date;
  keyVersion?: number;
}

export interface BundleSearchParams {
  environment?: IBundle['environment'][];
  createdBefore?: IBundle['createdAt'];
  createdAfter?: IBundle['createdAt'];
}

@Entity()
export class Bundle implements IBundle {
  @PrimaryColumn({ generated: 'identity', generatedIdentity: 'ALWAYS', insert: false })
  public id!: number;

  @Column({ type: 'text', nullable: true })
  public hash?: string;

  @Column({ type: 'enum', enum: Environment, enumName: 'environment_enum' })
  public environment!: Environment;

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
}
