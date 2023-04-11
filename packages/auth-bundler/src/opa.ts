import { execa } from './wrappers/execa';

export async function validateBinaryExist(): Promise<boolean> {
  const res = await execa('opa', ['version'], { reject: false });

  return !res.failed;
}

export async function checkFiles(path: string): Promise<[true, undefined] | [false, object]> {
  const res = await execa('opa', ['check', '-b', path, '-f', 'json'], { reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, JSON.parse(res.stderr)];
}

export async function test(path: string): Promise<[true, undefined] | [false, object]> {
  const res = await execa('opa', ['test', '-b', path, '-f', 'json'], { reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, JSON.parse(res.stdout)];
}

export async function testCoverage(path: string): Promise<number> {
  const res = await execa('opa', ['test', '-c', '-b', path, '-f', 'json']);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return JSON.parse(res.stdout).coverage as number;
}

export async function createBundle(filesPath: string, bundlePath: string): Promise<[true, undefined] | [false, string]> {
  const res = await execa('opa', ['build', '-o', bundlePath, '-b', '.'], { cwd: filesPath, reject: false });

  if (!res.failed) {
    return [true, undefined];
  }
  return [false, res.stderr];
}
