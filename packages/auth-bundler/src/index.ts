import { existsSync } from 'fs';
// import { mkdir, rm } from 'fs/promises';
// import { createConnectionOptions, DbConfig, Environment } from '@map-colonies/auth-core';
// import { DataSource } from 'typeorm';
// import config from 'config';
import { createBundleCommand, testCommand, validateBinaryExistCommand, testCoverageCommand } from './opa';
import { createBundleDirectoryStructure } from './bundler';
import { BundleContent } from './types';

export { BundleDatabase } from './db';

// const WORKDIR = '/tmp/opa-bundler';

export interface TestOptions {
  enable: boolean;
  coverage?: number;
}

export async function createBundle(content: BundleContent, workDir: string, bundlePath: string, tests?: TestOptions): Promise<void> {
  if (!existsSync(workDir)) {
    throw new Error();
  }

  if (!(await validateBinaryExistCommand())) {
    throw new Error();
  }

  await createBundleDirectoryStructure(content, workDir);

  if (tests?.enable === true) {
    const [testCompleted, testErr] = await testCommand(workDir);
    if (!testCompleted) {
      throw new Error(JSON.stringify(testErr));
    }

    if (tests.coverage !== undefined) {
      const coverage = await testCoverageCommand(workDir);
      if (coverage < tests.coverage) {
        throw new Error(`tests coverage was: ${coverage}`);
      }
    }
  }

  const [creationCompleted, creationErr] = await createBundleCommand(workDir, bundlePath);

  if (!creationCompleted) {
    throw new Error(creationErr);
  }
}

// export const main = async (): Promise<void> => {
//   if (existsSync(WORKDIR)) {
//     await rm(WORKDIR, { force: true, recursive: true });
//   }

//   await mkdir(WORKDIR);

//   const connectionOptions = config.get<DbConfig>('db');

//   const dataSource = new DataSource({
//     ...createConnectionOptions(connectionOptions),
//   });

//   await dataSource.initialize();
//   const database = new BundleDatabase(dataSource);

//   const versions = await database.getLatestVersions(Environment.NP);
//   const content = await database.getBundleFromVersions(versions);
//   await createBundle(content, WORKDIR, '../bundle.tar.gz')
//   console.log(versions);

// await createDirectoryStructure(await database.getBundleFromVersions(versions), WORKDIR);
// await createBundle(WORKDIR, 'bundle.tar.gz')

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
// };

// main().catch(console.error);
