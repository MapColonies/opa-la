import { writeFileSync } from 'fs';
import path from 'path';
import jestOpenApi from 'jest-openapi';

writeFileSync('/tmp/avi14.txt', process.cwd());

jestOpenApi(path.join(process.cwd(), 'openapi3.yaml'));
