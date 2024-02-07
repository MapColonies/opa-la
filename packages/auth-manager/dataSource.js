const { DataSource } = require('typeorm');
const config = require('config');
const { createConnectionOptions } = require('@map-colonies/auth-core');

/**
 * @type {import("@map-colonies/auth-core").DbConfig}
 */
const connectionOptions = config.get('db');

const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});

module.exports = { appDataSource };
