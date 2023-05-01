import assert from 'node:assert';
import { Bundle } from '@map-colonies/auth-core';
import { BundleContentVersions } from '@map-colonies/auth-bundler/dist/types';

export function compareVersionsToBundle(bundle: Bundle, versions: BundleContentVersions): boolean {
  try {
    assert.deepStrictEqual(bundle.connections, versions.connections);
    assert.deepStrictEqual(bundle.assets, versions.assets);
    return bundle.environment === versions.environment && bundle.keyVersion === versions.keyVersion;
  } catch (error) {
    return false;
  }
}
