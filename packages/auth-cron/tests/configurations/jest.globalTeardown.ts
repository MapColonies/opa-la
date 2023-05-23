import { rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

export default async (): Promise<void> => {
  await rm(path.join(tmpdir(), 'authcrontests'), { force: true, recursive: true });
};
