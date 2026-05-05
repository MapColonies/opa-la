import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// 1. Get the dynamic list from Turbo
const output = execSync('pnpm exec turbo ls --output=json --filter="./apps/*"').toString();
const { packages } = JSON.parse(output);
// 2. Map over the packages to extract your custom metadata
const matrix = packages.items
  .map((pkg) => {
    const pkgJsonPath = path.join(pkg.path, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    return {
      service: pkg.name,
      // Provide a safe fallback just in case someone forgets to add it
      dockerfile: pkgJson.dockerfile,
      version: pkgJson.version,
    };
  })
  .filter((item) => item.dockerfile); // Filter out packages that don't have a dockerfile field

// 3. Output the raw JSON string (GitHub Actions needs it printed to stdout)
console.log(JSON.stringify(matrix));
