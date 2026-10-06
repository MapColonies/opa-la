import type { components } from 'auth-openapi';

export type Bundle = components['schemas']['bundle'];

export const aBundle = (overrides: Partial<Bundle> = {}): Bundle => ({
  id: 1,
  hash: 'sha256:abc123',
  revision: 'rev-1',
  metadata: { builtBy: 'ci' },
  assets: [{ name: 'authz.rego', version: 1 }],
  connections: [{ name: 'my-connection', version: 1 }],
  environment: 'np',
  createdAt: '2026-01-01T00:00:00.000Z',
  keyVersion: 1,
  opaVersion: '0.60.0',
  ...overrides,
});
