import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { set } from 'lodash';

const JSON_INDENT = 2;

/**
 * Merges configuration values into a local-test.json file for testing.
 * Uses lodash.set path notation (e.g., 'db.host', 'db.ssl.enabled').
 *
 * @param configDir - Absolute path to the config directory (e.g., path.join(__dirname, '../config'))
 * @param updates - Map of path to value (e.g., { 'db.host': 'localhost', 'db.port': 5432 })
 * @param baseConfigFile - Name of the base config file to read from (default: 'test.json')
 *
 * @example
 * ```typescript
 * await mergeTestConfig(
 *   path.join(__dirname, '../config'),
 *   {
 *     'db.host': container.getHost(),
 *     'db.port': container.getPort(),
 *     'db.ssl.enabled': true,
 *     'db.ssl.ca': certs.rootCert,
 *   }
 * );
 * ```
 */
export async function mergeTestConfig(configDir: string, updates: Record<string, unknown>, baseConfigFile: string = 'test.json'): Promise<void> {
  const baseConfigPath = path.join(configDir, baseConfigFile);
  const outputPath = path.join(configDir, 'local-test.json');

  // Read base config
  let baseConfig = {};
  if (existsSync(baseConfigPath)) {
    const content = await readFile(baseConfigPath, 'utf-8');
    baseConfig = JSON.parse(content) as typeof baseConfig;
  }

  // Apply updates using lodash.set
  const mergedConfig = { ...baseConfig };
  for (const [keyPath, value] of Object.entries(updates)) {
    set(mergedConfig, keyPath, value);
  }

  // Write to local-test.json
  await writeFile(outputPath, JSON.stringify(mergedConfig, null, JSON_INDENT), 'utf-8');
}
