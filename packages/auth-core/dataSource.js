const { DataSource } = require('typeorm');
const { getConfig } = require('./dist/config.js');
const { createConnectionOptions } = require('./dist/db/utils/createConnection');

const connectionOptions = getConfig().getAll();
const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});

module.exports = { appDataSource };
