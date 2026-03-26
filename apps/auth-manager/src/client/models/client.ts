import type { operations } from '@src/openapi';

type DateKeys = 'createdBefore' | 'createdAfter' | 'updatedBefore' | 'updatedAfter';

// Converts date string query parameters to Date objects
export type ClientSearchParams = Omit<NonNullable<operations['getClients']['parameters']['query']>, DateKeys> & { [P in DateKeys]?: Date };
