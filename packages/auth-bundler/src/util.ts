import { createHash } from 'crypto';
import { BundleContentVersions } from './types';

export function extractNameAndVersion<T extends { name: string; version: number }>(entities: T[]): { name: string; version: number }[] {
  return entities.map((a) => ({ name: a.name, version: a.version }));
}

export function createBundleHash(versions: BundleContentVersions): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(versions));
  return hash.digest('base64');
}
