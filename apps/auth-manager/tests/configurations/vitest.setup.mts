import 'reflect-metadata';

import path from 'node:path';
import { setupOpenapi } from '@map-colonies/vitest-utils';

setupOpenapi(path.join(process.cwd(), 'openapi3.yaml'));
