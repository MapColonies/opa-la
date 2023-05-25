/* eslint-disable */
import { readFile, writeFile } from 'node:fs/promises';
import set from 'just-safe-set';
import { parse, stringify } from 'yaml';

const version = JSON.parse(await readFile('lerna.json')).version;

if (version === undefined) {
  throw new Error('version is undefined');
}

const files = [
  { path: 'packages/auth-manager/openapi3.yaml', targets: ['info.version'] },
  { path: 'packages/auth-manager/helm/Chart.yaml', targets: ['version', 'appVersion'] },
  { path: 'packages/auth-cron/helm/Chart.yaml', targets: ['version', 'appVersion'] },
];

for (const file of files) {
  const content = parse(await readFile(file.path, { encoding: 'utf-8' }));
  for (const target of file.targets) {
    set(content, target, version);
  }
  writeFile(file.path, stringify(content), { encoding: 'utf-8' });
}
