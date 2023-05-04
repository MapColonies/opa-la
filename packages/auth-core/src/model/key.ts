import { Environment } from './common';

/**
 * JSON representation of a public key
 */
export interface JWKPublicKey {
  kty: string;
  n: string;
  e: string;
  alg: string;
  kid: string;
}

/**
 * JSON representation of a private key
 */
export interface JWKPrivateKey extends JWKPublicKey {
  d: string;
  p: string;
  q: string;
  dp: string;
  dq: string;
  qi: string;
}

/**
 * A representation of a authentication key for a specific environment.
 */
export interface IKey {
  /**
   * The version of the key with the given {@link environment}. Starts at 1 and automatically increments.
   * When updated, the POST body should contain the latest version.
   */
  environment: Environment;
  /** The environment this key relates to. */
  version: number;
  privateKey?: JWKPrivateKey;
  publicKey?: JWKPublicKey;
}
