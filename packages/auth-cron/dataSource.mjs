/* eslint-disable @4-eslint/no-unsafe-assignment */
import { DataSource } from 'typeorm';
import { createConnectionOptions } from '@map-colonies/auth-core';

/**
 *
 * @param {string} moduleName
 * @returns {Promise<object>}
 */
async function importModule(moduleName) {
  let imported;
  try {
    imported = await import(`./${moduleName}`);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ERR_MODULE_NOT_FOUND') {
      imported = await import(`./dist/${moduleName}`);
    } else {
      throw err;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return imported;
}

await importModule('instrumentation.mjs');

const { getConfig } = await importModule('config.js');

const configOption = getConfig().get('db');
const connectionOptions = configOption;

const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});

export default appDataSource;
