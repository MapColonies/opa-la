import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Environment, IKey, JWKPrivateKey, JWKPublicKey } from '../../model';

@Entity()
export class Key implements IKey {
  @PrimaryColumn({ type: 'enum', enum: Environment, unique: true, enumName: 'environment_enum' })
  public environment!: Environment;

  @PrimaryColumn({ type: 'integer' })
  public version!: number;

  @Column({ type: 'jsonb', nullable: true, name: 'private_key' })
  public privateKey?: JWKPrivateKey;

  @Column({ type: 'jsonb', nullable: true, name: 'public_key' })
  public publicKey?: JWKPublicKey;
}
