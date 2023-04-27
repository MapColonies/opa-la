/**
 * This file contains all the interactions with the opa cli executable
 * @module
 * @see {@link https://www.openpolicyagent.org/docs/latest/cli/}
 * @ignore
 */
import { execa } from './wrappers/execa';

/**
 * Checks that the opa-cli exists on the current machine.
 * @returns true if exists, otherwise false
 * @ignore
 */
export async function validateBinaryExistCommand(): Promise<boolean> {
  const res = await execa('opa', ['version'], { reject: false });

  return !res.failed;
}

/**
 * Runs the check command on all the files as a bundle
 * @param path The directory path to run the command on
 * @returns true if the command ran successfully, false and the returned error otherwise
 * @see {@link https://www.openpolicyagent.org/docs/latest/cli/#opa-check}
 * @ignore
 */
export async function checkFilesCommand(path: string): Promise<[true, undefined] | [false, object]> {
  const res = await execa('opa', ['check', '-b', path, '-f', 'json'], { reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, JSON.parse(res.stderr)];
}

/**
 * Runs the test command on all the files as a bundle
 * @param path The directory path to run the command on
 * @returns true if the command ran successfully, false and the returned error otherwise
 * @see {@link https://www.openpolicyagent.org/docs/latest/cli/#opa-test}
 * @ignore
 */
export async function testCommand(path: string): Promise<[true, undefined] | [false, object]> {
  const res = await execa('opa', ['test', '-b', path, '-f', 'json'], { reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, JSON.parse(res.stdout)];
}

/**
 * Checks for the coverage of the tests in the bundle
 * @param path The directory path to run the command on
 * @returns The coverage percentage of the tests
 * @see {@link https://www.openpolicyagent.org/docs/latest/cli/#opa-test}
 * @ignore
 */
export async function testCoverageCommand(path: string): Promise<number> {
  const res = await execa('opa', ['test', '-c', '-b', path, '-f', 'json']);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return JSON.parse(res.stdout).coverage as number;
}

/**
 * Runs the build command to create a bundle tarball from the given directory
 * @param filesPath The path of the files from which to create the bundle
 * @param bundlePath The path in which to save the created bundle. note: the path is relative to filesPath.
 * @returns true if the command ran successfully, false and the returned error otherwise
 * @see {@link https://www.openpolicyagent.org/docs/latest/cli/#opa-build}
 * @ignore
 */
export async function createBundleCommand(filesPath: string, bundlePath: string): Promise<[true, undefined] | [false, string]> {
  const res = await execa('opa', ['build', '-o', bundlePath, '-b', '.'], { cwd: filesPath, reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, res.stdout];
}
