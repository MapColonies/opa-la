import type { components } from 'auth-openapi';

export type Asset = components['schemas']['asset'];

export const encodeText = (text: string): string => btoa(String.fromCharCode(...new TextEncoder().encode(text)));

export const anAsset = (overrides: Partial<Asset> = {}): Asset => ({
  name: 'authz.rego',
  value: encodeText('package authz\n'),
  uri: '/',
  type: 'POLICY',
  isTemplate: false,
  version: 1,
  environment: ['np'],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});
