import { createHash } from 'node:crypto';
import stringify from 'fast-json-stable-stringify';
import type { BundleContentVersions } from './types';

const HASH_LENGTH = 12;

export function extractNameAndVersion<T extends { name: string; version: number }>(entities: T[]): [string[], number[]] {
  const names: string[] = [];
  const versions: number[] = [];
  for (const entity of entities) {
    names.push(entity.name);
    versions.push(entity.version);
  }
  return [names, versions];
}

export function computeRevision(versions: BundleContentVersions): string {
  const sortedAssets = [...versions.assets].sort((a, b) => a.name.localeCompare(b.name));
  const sortedConnections = [...versions.connections].sort((a, b) => a.name.localeCompare(b.name));
  const canonical = stringify({
    environment: versions.environment,
    assets: sortedAssets,
    connections: sortedConnections,
    keyVersion: versions.keyVersion,
  });
  const shortHash = createHash('sha256').update(canonical).digest('hex').substring(0, HASH_LENGTH);
  return `${versions.environment}-${shortHash}`;
}
