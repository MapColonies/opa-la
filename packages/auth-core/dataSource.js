const { DataSource } = require('typeorm');
const config = require('config');
const { createConnectionOptions } = require('./db/utils/createConnection');

/**
 * @type {import("./src/db/types").DbConfig}
 */
const connectionOptions = config.get('db');

const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});

module.exports = { appDataSource };
