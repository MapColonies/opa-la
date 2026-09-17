import type { components } from 'auth-openapi';

type Asset = components['schemas']['asset'];

export type AssetSortField = 'name' | 'version' | 'type' | 'environment' | 'isTemplate' | 'uri' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface AssetSort {
  field: AssetSortField;
  direction: SortDirection;
}

/**
 * Sorting is client-side because GET /asset offers none. Comparable forms only,
 * so a column of arrays or booleans orders as predictably as a column of strings.
 */
const comparableValue = (asset: Asset, field: AssetSortField): string | number => {
  switch (field) {
    case 'version':
      return asset.version;
    case 'isTemplate':
      return asset.isTemplate ? 1 : 0;
    case 'environment':
      return [...asset.environment].sort().join(',');
    default:
      return asset[field];
  }
};

export const sortAssets = (assets: Asset[], sort: AssetSort | null): Asset[] => {
  if (!sort) return assets;

  return [...assets].sort((left, right) => {
    const a = comparableValue(left, sort.field);
    const b = comparableValue(right, sort.field);
    const order = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
    return sort.direction === 'asc' ? order : -order;
  });
};

export const parseSort = (raw: string | null): AssetSort | null => {
  if (!raw) return null;
  const [field, direction] = raw.split(':');
  if (!field) return null;
  return { field: field as AssetSortField, direction: direction === 'desc' ? 'desc' : 'asc' };
};

/** asc on first click, desc on the second, unsorted on the third. */
export const nextSort = (current: AssetSort | null, field: AssetSortField): AssetSort | null => {
  if (current?.field !== field) return { field, direction: 'asc' };
  return current.direction === 'asc' ? { field, direction: 'desc' } : null;
};
