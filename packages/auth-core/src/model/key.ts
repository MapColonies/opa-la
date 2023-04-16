import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Environment } from './common';

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
