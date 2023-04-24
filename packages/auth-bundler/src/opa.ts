import { join } from 'node:path';
import { cwd } from 'node:process';
import { execa } from './wrappers/execa';

export async function validateBinaryExistCommand(): Promise<boolean> {
  const res = await execa('opa', ['version'], { reject: false });

  return !res.failed;
}

export async function checkFilesCommand(path: string): Promise<[true, undefined] | [false, object]> {
  const res = await execa('opa', ['check', '-b', path, '-f', 'json'], { reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, JSON.parse(res.stderr)];
}

export async function testCommand(path: string): Promise<[true, undefined] | [false, object]> {
  const res = await execa('opa', ['test', '-b', path, '-f', 'json'], { reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, JSON.parse(res.stdout)];
}

export async function testCoverageCommand(path: string): Promise<number> {
  const res = await execa('opa', ['test', '-c', '-b', path, '-f', 'json']);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return JSON.parse(res.stdout).coverage as number;
}

export async function createBundleCommand(filesPath: string, bundlePath: string): Promise<[true, undefined] | [false, string]> {
  const res = await execa('opa', ['build', '-o', join(cwd(), bundlePath), '-b', '.'], { cwd: filesPath, reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, res.stderr];
}
