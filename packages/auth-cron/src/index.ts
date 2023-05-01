import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { DbConfig, createConnectionOptions, Bundle, Environment } from '@map-colonies/auth-core';
import { createBundle, BundleDatabase } from '@map-colonies/auth-bundler';
import config from 'config';
import { CatchCallbackFn, Cron } from 'croner';
import { DataSource } from 'typeorm';
import { compareVersionsToBundle } from './util';
import { getObjectHash, uploadFile } from './s3';

const bucket = 'opa';
const objectKey = 'bundle.tar.gz';

const connectionOptions = config.get<DbConfig>('db');

console.log(config.get('.'));
throw new Error();

const dataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});


const environment = Environment.NP;

const errorHandler: CatchCallbackFn = (err, job) => {
  console.error(`failed executing job ${job.name ?? ''}`);
  console.error(err);
};

const main = async (): Promise<void> => {
  await dataSource.initialize();
  const db = new BundleDatabase(dataSource);

  const job = Cron('*/5 * * * * *', { unref: true, protect: true, catch: errorHandler, name: 'np-job' }, async () => {
    console.log('starting new check');
    const latestBundle = await dataSource.getRepository(Bundle).findOne({ where: { environment }, order: { id: 'DESC' } });
    const latestVersions = await db.getLatestVersions(environment);

    let shouldSaveBundleToDb = true;

    if (latestBundle !== null && compareVersionsToBundle(latestBundle, latestVersions)) {
      if (latestBundle.hash === (await getObjectHash(bucket, objectKey))) {
        console.log('everything is up to date');
        return;
      }
      shouldSaveBundleToDb = false;
    }
    console.log('creating new bundle');

    const bundleContent = await db.getBundleFromVersions(latestVersions);
    const workdir = mkdtempSync(path.join(tmpdir(), 'authbundler-'));

    await createBundle(bundleContent, workdir, 'bundle.tar.gz');

    const hash = await uploadFile(bucket, objectKey,path.join(workdir, 'bundle.tar.gz'));
    if (shouldSaveBundleToDb) {
      const id = await db.saveBundle(latestVersions, hash);
      console.log(id);
    }
    rmSync(workdir, { force: true, recursive: true });
  });

  job.nextRun();
  // if (!dataInDbIsNewer()) {
  //   if (storageHash != dbHash) {
  //     recreateBundle()
  //     uploadBundle()
  //   } else {
  //     doNothing()
  //   }
  // }

  // getNewDataFromDb()
  // createBundle()
  // uploadBundle()
  // registerBundle()
};

main().catch(console.error);
