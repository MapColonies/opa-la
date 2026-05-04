import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tokenOpenapiPath = fileURLToPath(new URL('.', import.meta.resolve('token-openapi')));

export const OPENAPI_PATH = path.join(tokenOpenapiPath, 'openapi3.yaml');
