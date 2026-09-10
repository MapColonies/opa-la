import type { components } from 'auth-openapi';

type Asset = components['schemas']['asset'];

/**
 * GET /asset/{assetName} answers with the asset version rows for that name, of unknown
 * length. Today the write path leaves exactly one, but nothing here assumes that.
 */
const byVersionDescending = (versions: Asset[]): Asset[] => [...versions].sort((left, right) => right.version - left.version);

export const latestOf = (versions: Asset[]): Asset | undefined => byVersionDescending(versions)[0];
