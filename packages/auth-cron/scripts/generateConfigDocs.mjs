import { readFileSync, writeFileSync } from 'fs';
import { jsonschema2md } from '@adobe/jsonschema2md';
import config from '../src/config.js';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
const res = jsonschema2md(config.configSchema, { includeReadme: true });
const readme = readFileSync('../README.md', { encoding: 'utf-8' });

// console.log(res.markdown);
for (const file of res.markdown) {
  writeFileSync(path.join('files', file.fileName), file.content);
}

// const startIndex = readme.indexOf('<!--- config start --->');
// const endIndex = readme.indexOf('<!--- config end --->', startIndex);

// const newReadme = readme.substring(0, startIndex) + '<!--- config start --->' + markdown + readme.substring(endIndex);

// writeFileSync('README.md', newReadme, { encoding: 'utf-8' });
