const { DataSource } = require('typeorm');
const { getConfig } = require('./dist/config.js');
const { createConnectionOptions } = require('@map-colonies/auth-core');

const configOption = getConfig().get('db');
const connectionOptions = configOption;

const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});

module.exports = { appDataSource };
