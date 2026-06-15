import path from 'node:path';
import { fileURLToPath } from 'node:url';

const authOpenapiPath = fileURLToPath(new URL('.', import.meta.resolve('auth-openapi')));

export const OPENAPI_PATH = path.join(authOpenapiPath, 'openapi3.yaml');
