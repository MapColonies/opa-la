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
import { OpaBundleCreationError, OpaCoverageTooLowError, OpaNotFoundError, OpaTestsFailedError, WorkdirNotFoundError } from './errors';

export * from './errors';
export { setLogger } from './logger';
export { BundleDatabase } from './db';
export * from './types';

/**
 * This function creates an opa bundle tarball from the given content
 * @param content The data from which to create the bundle
 * @param workDir The place where the bundle will be created
 * @param bundlePath The relative path compared to workDir
 * @param tests Controls whether to run tests and/or coverage
 * @throws {@link WorkdirNotFoundError} If the workDir doesn't exist.
 * @throws {@link OpaNotFoundError} If the OPA binary wasn't detected in the OS path.
 * @throws {@link OpaTestsFailedError} If the OPA tests failed.
 * @throws {@link OpaCoverageTooLowError} If the OPA tests coverage was below the threshold.
 * @throws {@link OpaBundleCreationError} If the OPA bundle creation process failed.

 */
export async function createBundle(content: BundleContent, workDir: string, bundlePath: string, tests?: TestOptions): Promise<void> {
  logger?.info({ msg: 'creating bundle', workDir, bundlePath });
  if (!existsSync(workDir)) {
    logger?.debug('workdir does not exists');
    throw new WorkdirNotFoundError('The workdir given does not exists');
  }

  if (!(await validateBinaryExistCommand())) {
    logger?.debug('opa is missing');
    throw new OpaNotFoundError('OPA cli is missing from path');
  }

  await createBundleDirectoryStructure(content, workDir);

  if (tests?.enable === true) {
    logger?.debug('tests are enabled');
    const [testCompleted, testErr] = await testCommand(workDir);
    if (!testCompleted) {
      throw new OpaTestsFailedError(JSON.stringify(testErr));
    }

    if (tests.coverage !== undefined) {
      logger?.debug('test coverage is enabled');

      const coverage = await testCoverageCommand(workDir);
      if (coverage < tests.coverage) {
        logger?.debug('test coverage is below threshold');

        throw new OpaCoverageTooLowError(`tests coverage was: ${coverage}`);
      }
    }
  }

  const [creationCompleted, creationErr] = await createBundleCommand(workDir, bundlePath);

  if (!creationCompleted) {
    logger?.debug('failed creating bundle');

    throw new OpaBundleCreationError(creationErr);
  }

  logger?.debug('bundle created successfully');
}
