/* eslint-disable */
import 'zx/globals';
import { readFile, writeFile } from 'node:fs/promises';
import set from 'just-safe-set';
import { parse, stringify, parseAllDocuments } from 'yaml';

// Update version in files
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
  await writeFile(file.path, stringify(content), { encoding: 'utf-8' });
}

// Update backstage openapi
const openapi = await readFile('packages/auth-manager/openapi3.yaml');
const catalogInfo = parseAllDocuments(await readFile('catalog-info.yaml', { encoding: 'utf-8' }));
catalogInfo
  .find((doc) => doc.get('kind') === 'API' && doc.getIn(['metadata', 'name']) === 'auth-manager-api')
  .setIn(['spec', 'definition'], openapi.toString());
const newCatalogInfo = catalogInfo.map((doc) => stringify(doc)).join('---\n');
await writeFile('catalog-info.yaml', newCatalogInfo);

$`git add ${[...files.map((f) => f.path), 'catalog-info.yaml']}`;
