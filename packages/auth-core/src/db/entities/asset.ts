import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { AssetType, type AssetTypes, Environment, type Environments, IAsset } from '../../model';

/**
 * The typeorm implementation of the IAsset interface.
 */
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
  public type!: AssetTypes;

  @Column({ type: 'enum', enum: Environment, array: true, enumName: 'environment_enum' })
  public environment!: Environments[];

  @Column({ type: 'boolean', name: 'is_template' })
  public isTemplate!: boolean;
}
