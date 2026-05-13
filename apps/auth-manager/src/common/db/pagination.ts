import { SQL } from 'drizzle-orm';
import { PgColumn, PgSelect } from 'drizzle-orm/pg-core';

export const DEFAULT_PAGE_SIZE = 10;
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function paginationParamsToFindOptions(paginationParams?: PaginationParams): { take?: number; skip?: number } {
  if (paginationParams === undefined) {
    return {};
  }

  const { page, pageSize } = paginationParams;

  return {
    take: pageSize,
    skip: (page - 1) * pageSize,
  };
}

// TODO - move to generic package
export function withPagination<T extends PgSelect>(qb: T, orderByColumn: PgColumn | SQL | SQL.Aliased, params: PaginationParams): T {
  const { page, pageSize } = params;
  return qb
    .orderBy(orderByColumn)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}
