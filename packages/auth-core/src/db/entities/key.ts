import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Environment, type Environments, IKey, type JWKPrivateKey, type JWKPublicKey } from '../../model';

/**
 * The typeorm implementation of the IKey interface.
 */
@Entity()
export class Key implements IKey {
  @PrimaryColumn({ type: 'enum', enum: Environment, unique: true, enumName: 'environment_enum' })
  public environment!: Environments;

  @PrimaryColumn({ type: 'integer' })
  public version!: number;

  @Column({ type: 'jsonb', name: 'private_key' })
  public privateKey!: JWKPrivateKey;

  @Column({ type: 'jsonb', name: 'public_key' })
  public publicKey!: JWKPublicKey;
}
