import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BundleDatabase, createBundle } from '@map-colonies/auth-bundler';
import { Bundle, Environment } from '@map-colonies/auth-core';
import { Repository } from 'typeorm';
import { getS3Client } from './s3';
import { compareVersionsToBundle } from './util';

export function getJob(
  bundleRepository: Repository<Bundle>,
  bundleDatabase: BundleDatabase,
  environment: Environment,
  workdir: string
): () => Promise<void> {
  return async () => {
    console.log('starting new check');
    const latestBundle = await bundleRepository.findOne({ where: { environment }, order: { id: 'DESC' } });
    const latestVersions = await bundleDatabase.getLatestVersions(environment);

    let shouldSaveBundleToDb = true;

    if (latestBundle !== null && compareVersionsToBundle(latestBundle, latestVersions)) {
      if (latestBundle.hash === (await getS3Client(environment).getObjectHash())) {
        console.log('everything is up to date');
        return;
      }
      shouldSaveBundleToDb = false;
    }
    console.log('creating new bundle');

    const bundleContent = await bundleDatabase.getBundleFromVersions(latestVersions);
    // const workdir = mkdtempSync(path.join(tmpdir(), 'authbundler-'));

    await createBundle(bundleContent, workdir, 'bundle.tar.gz');

    const hash = await getS3Client(environment).uploadFile(path.join(workdir, 'bundle.tar.gz'));

    if (shouldSaveBundleToDb) {
      const id = await bundleDatabase.saveBundle(latestVersions, hash);
      console.log(id);
    }

    // rmSync(workdir, { force: true, recursive: true });
  };
}
