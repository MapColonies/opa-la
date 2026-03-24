import { createHash } from 'node:crypto';
import { BundleContentVersions } from './types';

const HASH_LENGTH = 12;

export function extractNameAndVersion<T extends { name: string; version: number }>(entities: T[]): { name: string; version: number }[] {
  return entities.map((a) => ({ name: a.name, version: a.version }));
}

export function computeRevision(versions: BundleContentVersions): string {
  const sortedAssets = [...versions.assets].sort((a, b) => a.name.localeCompare(b.name));
  const sortedConnections = [...versions.connections].sort((a, b) => a.name.localeCompare(b.name));
  const canonical = JSON.stringify({
    environment: versions.environment,
    assets: sortedAssets,
    connections: sortedConnections,
    keyVersion: versions.keyVersion,
  });
  const shortHash = createHash('sha256').update(canonical).digest('hex').substring(0, HASH_LENGTH);
  return `${versions.environment}-${shortHash}`;
}
