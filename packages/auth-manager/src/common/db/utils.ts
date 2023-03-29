import { Between, FindOperator, LessThan, MoreThan } from 'typeorm';

export function createDatesComparison(earlyDate?: Date, laterDate?: Date): FindOperator<Date> | undefined {
  if (earlyDate !== undefined && laterDate !== undefined) {
    return Between(earlyDate, laterDate);
  }
  if (earlyDate !== undefined) {
    return MoreThan(earlyDate);
  }
  if (laterDate !== undefined) {
    return LessThan(laterDate);
  }
  return undefined;
}
