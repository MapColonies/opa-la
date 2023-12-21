import { importJWK, JWK, SignJWT } from 'jose';
import { TOKENS_ISSUER } from './constants';

/**
 * Generates a JWT token using the provided private key, client, kid, and expiration time.
 * @param privateKey - The private key to use for signing the token.
 * @param client - The client for whom the token is being generated.
 * @param kid - The key ID to use in the token header.
 * @param expirationTime - The expiration time for the token.
 * @returns A Promise that resolves to the generated JWT token.
 */
export const generateToken = async (privateKey: JWK, client: string, kid?: string, expirationTime?: string): Promise<string> => {
  const jwt = new SignJWT().setIssuedAt().setProtectedHeader({ alg: 'RS256', kid }).setSubject(client).setIssuer(TOKENS_ISSUER);
  if (expirationTime !== undefined) {
    jwt.setExpirationTime(expirationTime);
  }
  const key = await importJWK(privateKey);
  return jwt.sign(key);
};
