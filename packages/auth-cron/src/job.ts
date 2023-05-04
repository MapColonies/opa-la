import path from 'node:path';
import { BundleDatabase, createBundle } from '@map-colonies/auth-bundler';
import { Bundle, Environment } from '@map-colonies/auth-core';
import { Repository } from 'typeorm';
import { getS3Client } from './s3';
import { compareVersionsToBundle } from './util';
import { logger } from './logger';

export function getJob(
  bundleRepository: Repository<Bundle>,
  bundleDatabase: BundleDatabase,
  environment: Environment,
  workdir: string
): () => Promise<void> {
  return async () => {
    logger.debug({ msg: 'fetching bundle information from the database', bundleEnv: environment });
    const latestBundle = await bundleRepository.findOne({ where: { environment }, order: { id: 'DESC' } });
    const latestVersions = await bundleDatabase.getLatestVersions(environment);

    let shouldSaveBundleToDb = true;

    if (latestBundle !== null && compareVersionsToBundle(latestBundle, latestVersions)) {
      if (latestBundle.hash === (await getS3Client(environment).getObjectHash())) {
        logger.info({ msg: 's3 bundle is up to date with the database', bundleEnv: environment });
        return;
      }
      shouldSaveBundleToDb = false;
    }

    logger.debug({ msg: 'creating new bundle as ', bundleEnv: environment });

    const bundleContent = await bundleDatabase.getBundleFromVersions(latestVersions);

    await createBundle(bundleContent, workdir, 'bundle.tar.gz');

    const hash = await getS3Client(environment).uploadFile(path.join(workdir, 'bundle.tar.gz'));

    if (shouldSaveBundleToDb) {
      logger.debug({ msg: 'saving bundle metadata to the database', bundleEnv: environment });
      await bundleDatabase.saveBundle(latestVersions, hash);
    }

    logger.info({ msg: 'created new bundle successfully', bundleEnv: environment });
  };
}
