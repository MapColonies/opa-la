import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
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
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'text' })
  public hash?: string;

  @Column({ type: 'enum', enum: Environment, enumName: 'environment_enum' })
  public environment!: Environment;

  @Column({ type: 'jsonb' })
  public metadata?: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  public assets?: { name: string; version: number }[];

  @Column({ type: 'jsonb' })
  public connections?: { name: string; version: number }[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  public createdAt?: Date;

  @Column({ name: 'key_version', type: 'integer' })
  public keyVersion?: number;
}
