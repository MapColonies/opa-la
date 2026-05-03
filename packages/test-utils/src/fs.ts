import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inject } from 'vitest';
import type { TestProject } from 'vitest/node';

const TEMP_DIR_INJECT_KEY = 'tempDir';

function getTempDirPath(name: string): string {
  return path.join(tmpdir(), name);
}

export function getTempDir(): string {
  return inject(TEMP_DIR_INJECT_KEY as never);
}

export async function createAndProvideTempDir(name: string, project: TestProject): Promise<string> {
  const folder = getTempDirPath(name);
  if (!existsSync(folder)) {
    await mkdir(folder);
  }
  project.provide(TEMP_DIR_INJECT_KEY as never, folder as never);

  return folder;
}

export async function removeTempDir(name: string): Promise<void> {
  await rm(getTempDirPath(name), { recursive: true, force: true });
}
