import { between, lt, gt, type SQL, type Column, asc, type AnyColumn, desc, type Subquery, type DrizzleQueryError } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { SortOptions } from './sort';

export function createDatesComparison(column: Column, earlyDate?: Date, laterDate?: Date): SQL | undefined {
  if (earlyDate !== undefined && laterDate !== undefined) {
    return between(column, earlyDate, laterDate);
  }
  if (earlyDate !== undefined) {
    return gt(column, earlyDate);
  }
  if (laterDate !== undefined) {
    return lt(column, laterDate);
  }
  return undefined;
}

export function sortOptionsToOrderBy<T extends PgTable | Subquery>(tableDefinition: T, sortOptions: SortOptions<T>): SQL[] {
  const result: SQL[] = [];
  for (const key in sortOptions) {
    const direction = sortOptions[key];

    if (direction === 'asc') {
      result.push(asc(tableDefinition[key] as AnyColumn));
    } else if (direction === 'desc') {
      result.push(desc(tableDefinition[key] as AnyColumn));
    }
  }
  return result;
}

export function isDrizzleQueryError(err: unknown): err is DrizzleQueryError {
  return typeof err === 'object' && err !== null && 'name' in err && (err as Error).name === 'DrizzleQueryError';
}
