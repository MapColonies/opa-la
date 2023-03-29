import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Environment } from '../../common/constants';

export interface JWKPublicKey {
  kty: string;
  n: string;
  e: string;
  alg: string;
  kid: string;
}

export interface JWKPrivateKey extends JWKPublicKey {
  d: string;
  p: string;
  q: string;
  dp: string;
  dq: string;
  qi: string;
}

export interface IKey {
  environment: Environment;
  version: number;
  privateKey?: JWKPrivateKey;
  publicKey?: JWKPublicKey;
}

@Entity()
export class Key implements IKey {
  @PrimaryColumn({ type: 'enum', enum: Environment, unique: true })
  public environment!: Environment;

  @PrimaryColumn({ type: 'integer' })
  public version!: number;

  @Column({ type: 'jsonb', nullable: true, name: 'private_key' })
  public privateKey?: JWKPrivateKey;

  @Column({ type: 'jsonb', nullable: true, name: 'public_key' })
  public publicKey?: JWKPublicKey;
}
