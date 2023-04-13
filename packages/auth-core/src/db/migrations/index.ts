/* eslint-disable */
import { readdirSync } from 'fs';
import path from 'path';

export const migrations: Function[] = readdirSync(__dirname)
  .filter((file) => /^\d[\da-zA-Z-]+\.(js|ts)$/.test(file))
  .sort()
  .map((file) => Object.values<Function>(require(path.join(__dirname, file)))[0]);
