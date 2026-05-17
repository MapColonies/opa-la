import { between, lt, gt, type SQL, type Column } from 'drizzle-orm';

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
