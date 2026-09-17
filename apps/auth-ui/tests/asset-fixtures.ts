import type { components } from 'auth-openapi';
import { http } from './http-stub';

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

/**
 * The stub a create needs, answering the way the server would: nothing under the name
 * until the post lands. The create page asks whether the name is taken before it posts,
 * and the asset page it lands on asks again for what was just written.
 */
export const stubCreating = (asset: Asset): void => {
  let rows: Asset[] = [];
  http.on('GET', `/asset/${asset.name}`, () => ({ body: rows }));
  http.on('POST', '/asset', () => {
    rows = [asset];
    return { status: 201, body: asset };
  });
};
