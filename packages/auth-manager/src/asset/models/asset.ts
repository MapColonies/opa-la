import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { Environment } from '../../common/constants';

export enum AssetType {
  TEST = 'TEST',
  TEST_DATA = 'TEST_DATA',
  POLICY = 'POLICY',
  DATA = 'DATA',
}

export interface AssetSearchParams {
  type?: AssetType;
  environment?: Environment[];
  isTemplate?: boolean;
}

export interface IAsset {
  name: string;
  version: number;
  createdAt?: Date;
  value: string;
  uri: string;
  type: AssetType;
  environment: Environment[];
  isTemplate: boolean;
}

@Entity()
export class Asset implements IAsset {
  @PrimaryColumn()
  public name!: string;

  @PrimaryColumn({ type: 'integer' })
  public version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  public createdAt!: Date;

  @Column({
    type: 'bytea',
    transformer: {
      from(value: Buffer): string {
        return value.toString('base64');
      },
      to(value: string): Buffer {
        return Buffer.from(value, 'base64');
      },
    },
  })
  public value!: string;

  @Column()
  public uri!: string;

  @Column({ type: 'enum', enum: AssetType })
  public type!: AssetType;

  @Column({ type: 'enum', enum: Environment, array: true })
  public environment!: Environment[];

  @Column({ type: 'boolean', name: 'is_template' })
  public isTemplate!: boolean;
}
