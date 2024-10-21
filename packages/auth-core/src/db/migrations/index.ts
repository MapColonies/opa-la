/* eslint-disable */
import { readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * A chronological sorted list of all the database migrations to create the latest authentication schema.
 */
export const migrations: Function[] = readdirSync(__dirname)
  .filter((file) => /^\d[\da-zA-Z-]+\.(js|ts)$/.test(file))
  .sort()
  .map((file) => Object.values<Function>(require(path.join(__dirname, file)))[0]);
