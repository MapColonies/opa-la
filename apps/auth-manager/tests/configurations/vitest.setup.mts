import 'reflect-metadata';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupOpenapi } from '@map-colonies/vitest-utils';

const authOpenapiPath = fileURLToPath(new URL('.', import.meta.resolve('auth-openapi')));

setupOpenapi(path.join(authOpenapiPath, 'openapi3.yaml'));
