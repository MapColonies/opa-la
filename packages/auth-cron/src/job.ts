import path from 'node:path';
import { BundleDatabase, createBundle, getVersionCommand } from '@map-colonies/auth-bundler';
import { Bundle, Environments } from '@map-colonies/auth-core';
import { Repository } from 'typeorm';
import { getS3Client } from './s3';
import { compareVersionsToBundle } from './util';
import { logger } from './telemetry/logger';

export function getJob(
  bundleRepository: Repository<Bundle>,
  bundleDatabase: BundleDatabase,
  environment: Environments,
  workdir: string
): () => Promise<void> {
  return async () => {
    logger?.debug({ msg: 'fetching bundle information from the database', bundleEnv: environment });
    const latestBundle = await bundleRepository.findOne({ where: { environment }, order: { id: 'DESC' } });
    const latestVersions = await bundleDatabase.getLatestVersions(environment);
    const currentOpaVersion = await getVersionCommand();

    logger?.debug({ msg: 'latest bundle from db', bundleEnv: environment, latestBundle, latestVersions });

    logger?.debug({ msg: 'checking if bundle is up to date', bundleEnv: environment, currentOpaVersion });

    let shouldSaveBundleToDb = true;
    if (latestBundle !== null && currentOpaVersion === latestBundle.opaVersion && compareVersionsToBundle(latestBundle, latestVersions)) {
      logger?.info({ msg: 'bundle is up to date with the database, checking s3', bundleEnv: environment });
      if (latestBundle.hash === (await getS3Client(environment).getObjectHash())) {
        logger?.info({ msg: 's3 bundle is up to date with the database', bundleEnv: environment });
        return;
      }
      logger?.info({ msg: 's3 bundle is not up to date with the database, creating new bundle', bundleEnv: environment });
      shouldSaveBundleToDb = false;
    }

    logger?.debug({ msg: 'creating new bundle as ', bundleEnv: environment });

    const bundleContent = await bundleDatabase.getBundleFromVersions(latestVersions);

    await createBundle(bundleContent, workdir, 'bundle.tar.gz');

    const hash = await getS3Client(environment).uploadFile(path.join(workdir, 'bundle.tar.gz'));

    if (shouldSaveBundleToDb) {
      logger?.debug({ msg: 'saving bundle metadata to the database', bundleEnv: environment });
      await bundleDatabase.saveBundle(latestVersions, hash);
    }

    logger?.info({ msg: 'created new bundle successfully', bundleEnv: environment });
  };
}
