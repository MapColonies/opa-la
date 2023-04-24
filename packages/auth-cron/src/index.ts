import { DbConfig, createConnectionOptions } from '@map-colonies/auth-core';
import {createBundle,BundleDatabase} from '@map-colonies/auth-bundler';
import config from 'config';
import { Cron } from 'croner';
import { DataSource } from 'typeorm';

const connectionOptions = config.get<DbConfig>('db');

const dataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});
const main = async (): Promise<void> => {
  await dataSource.initialize();
  const db = new BundleDatabase(dataSource);
  const job = Cron('* * * * * *', { unref: true, protect: true }, () => {

  });
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
