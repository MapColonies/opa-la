const { DataSource } = require('typeorm');
const config = require('config');
const { createConnectionOptions } = require('./db/utils/createConnection');

/**
 * @type {import("./src/db/types").DbConfig}
 */
const connectionOptions = config.get('db');

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const appDataSource = new DataSource({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  ...createConnectionOptions(connectionOptions),
});

module.exports = { appDataSource };
