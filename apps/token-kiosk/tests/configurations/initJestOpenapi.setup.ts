/* eslint-disable */
import path from 'node:path';
import { expect } from 'vitest';
import jestOpenApi from 'jest-openapi';

//@ts-ignore
globalThis.expect = expect;

jestOpenApi(path.join(process.cwd(), 'openapi3.yaml'));

//@ts-ignore
globalThis.expect = undefined as any; // Reset global expect to avoid conflicts with other test frameworks
