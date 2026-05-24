import type { SQL } from 'drizzle-orm';
import type { PgColumn, PgSelect } from 'drizzle-orm/pg-core';

export const DEFAULT_PAGE_SIZE = 10;
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function paginationParamsToOffsetAndLimit(paginationParams?: PaginationParams): { limit: number; offset: number } {
  if (paginationParams === undefined) {
    return { limit: DEFAULT_PAGE_SIZE, offset: 0 };
  }

  const { page, pageSize } = paginationParams;

  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}
