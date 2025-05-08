import assert from 'node:assert';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { Bundle } from '@map-colonies/auth-core';
import { BundleContentVersions } from '@map-colonies/auth-bundler/dist/types';

export function compareVersionsToBundle(bundle: Bundle, versions: BundleContentVersions): boolean {
  try {
    assert.deepStrictEqual(bundle.connections, versions.connections);
    assert.deepStrictEqual(bundle.assets, versions.assets);
    return bundle.environment === versions.environment && bundle.keyVersion === versions.keyVersion;
  } catch {
    return false;
  }
}

export async function emptyDir(dirPath: string): Promise<void> {
  const files = await readdir(dirPath);
  await Promise.all(files.map(async (file) => rm(path.join(dirPath, file), { force: true, recursive: true })));
}
