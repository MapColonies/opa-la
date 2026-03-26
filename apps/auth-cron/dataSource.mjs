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
  return imported;
}

const { getConfig, initConfig } = await importModule('config.js');

await initConfig();
const configOption = getConfig().get('db');
const connectionOptions = configOption;

const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});

export default appDataSource;
