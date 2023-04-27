/**
 * A library to facilitate creating authentication bundles for consumption with {@link https://www.openpolicyagent.org/docs/latest/management-bundles/ | Open Policy Agent}.
 *
 * The library has two main parts:
 * - { @link createBundle} - A function to create the bundles.
 * - { @link BundleDatabase } - A helper class to make all the required database actions when creating a bundle.
 *
 * @packageDocumentation
 */
import { existsSync } from 'fs';
import { createBundleCommand, testCommand, validateBinaryExistCommand, testCoverageCommand } from './opa';
import { createBundleDirectoryStructure } from './bundler';
import { BundleContent, TestOptions } from './types';
import { logger } from './logger';

export { setLogger, unsetLogger } from './logger';
export { BundleDatabase } from './db';
export * from './types';

export async function createBundle(content: BundleContent, workDir: string, bundlePath: string, tests?: TestOptions): Promise<void> {
  logger?.info({ msg: 'creating bundle', workDir, bundlePath });
  if (!existsSync(workDir)) {
    logger?.debug('workdir does not exists');
    throw new Error('The workdir given does not exists');
  }

  if (!(await validateBinaryExistCommand())) {
    logger?.debug('opa is missing');
    throw new Error('OPA cli is missing from path');
  }

  await createBundleDirectoryStructure(content, workDir);

  if (tests?.enable === true) {
    logger?.debug('tests are enabled');
    const [testCompleted, testErr] = await testCommand(workDir);
    if (!testCompleted) {
      throw new Error(JSON.stringify(testErr));
    }

    if (tests.coverage !== undefined) {
      logger?.debug('test coverage is enabled');

      const coverage = await testCoverageCommand(workDir);
      if (coverage < tests.coverage) {
        logger?.debug('test coverage is below threshold');

        throw new Error(`tests coverage was: ${coverage}`);
      }
    }
  }

  const [creationCompleted, creationErr] = await createBundleCommand(workDir, bundlePath);

  if (!creationCompleted) {
    logger?.debug('failed creating bundle');

    throw new Error(creationErr);
  }

  logger?.debug('bundle created successfully');
}
