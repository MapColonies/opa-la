/* eslint-disable */
import 'zx/globals';
import { parseArgs } from 'node:util';

const {
  values: { name, destination },
} = parseArgs({
  options: {
    name: {
      type: 'string',
      short: 'n',
    },
    destination: {
      type: 'string',
      short: 'd',
    },
  },
});

// parse used packages
const res = await $`npx lerna --include-dependencies --scope ${name} ls -a --json`;
const packages = JSON.parse(res.stdout);

// copy root package json
await Promise.all((await glob(['package*.json', '!**/node_modules'], {})).map((file) => fs.copy(file, path.join(destination, file))));

// copy package
const mainFolderName = packages[0].location.split('/').slice(-1)[0];
fs.copy(path.join(packages[0].location, 'dist'), path.join(destination, 'packages', mainFolderName));

// copy dependencies
for (const packageInfo of packages.slice(1)) {
  const folderName = packageInfo.location.split('/').slice(-1)[0];
  fs.copy(path.join(packageInfo.location, 'package.json'), path.join(destination, 'packages', folderName, 'package.json'));
  fs.copy(path.join(packageInfo.location, 'dist'), path.join(destination, 'packages', folderName, 'dist'));
}
