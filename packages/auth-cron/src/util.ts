import assert from 'node:assert';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { Bundle } from '@map-colonies/auth-core';
import { BundleContentVersions } from '@map-colonies/auth-bundler/dist/types';
import { logger } from './telemetry/logger';

export function compareVersionsToBundle(bundle: Bundle, versions: BundleContentVersions): boolean {
  try {
    logger?.debug({ msg: 'comparing connections', bundleEnv: versions.environment });
    assert.deepStrictEqual(bundle.connections, versions.connections);
    logger?.debug({ msg: 'comparing assets', bundleEnv: versions.environment });
    assert.deepStrictEqual(bundle.assets, versions.assets);

    logger?.debug({ msg: 'comparing key version', bundleEnv: versions.environment });

    // Added the check because keyVersion can be null in the database
    // and we want a new bundle to be created in that case
    // the bigger fix should be to not allow null keyVersion in the database
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return bundle.environment === versions.environment && bundle.keyVersion !== null && bundle.keyVersion === versions.keyVersion;
  } catch {
    return false;
  }
}

export async function emptyDir(dirPath: string): Promise<void> {
  const files = await readdir(dirPath);
  await Promise.all(files.map(async (file) => rm(path.join(dirPath, file), { force: true, recursive: true })));
}
