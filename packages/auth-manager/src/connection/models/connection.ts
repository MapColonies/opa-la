import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { Environment } from '../../common/constants';

export interface ConnectionSearchParams {
  environment?: Environment[];
  isEnabled?: boolean;
  isNoBrowser?: boolean;
  isNoOrigin?: boolean;
  domains?: string[];
  name?: string;
}

export interface IConnection {
  name: string;
  version: number;
  environment: Environment;
  createdAt?: Date;
  enabled: boolean;
  token: string;
  allowNoBrowserConnection: boolean;
  allowNoOriginConnection: boolean;
  domains: string[];
  origins: string[];
}

@Entity()
export class Connection implements IConnection {
  @PrimaryColumn()
  public name!: string;

  @PrimaryColumn({ type: 'integer' })
  public version!: number;

  @PrimaryColumn({ type: 'enum', enum: Environment, enumName: 'environment_enum' })
  public environment!: Environment;

  @Column({ type: 'boolean' })
  public enabled!: boolean;

  @Column({ type: 'text' })
  public token!: string;

  @Column({ type: 'boolean', name: 'allow_no_browser' })
  public allowNoBrowserConnection!: boolean;

  @Column({ type: 'boolean', name: 'allow_no_origin' })
  public allowNoOriginConnection!: boolean;

  @Column({ type: 'text', array: true })
  public domains!: string[];

  @Column({ type: 'text', array: true })
  public origins!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  public createdAt!: Date;
}
