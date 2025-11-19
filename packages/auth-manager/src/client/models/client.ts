import type { operations } from '@src/openapi';

type QueryParamsWithoutDates = Omit<
  NonNullable<operations['getClients']['parameters']['query']>,
  'createdBefore' | 'createdAfter' | 'updatedBefore' | 'updatedAfter'
>;

export type ClientSearchParams = QueryParamsWithoutDates & {
  /** The date fields converted to Date type */
  createdBefore?: Date;
  createdAfter?: Date;
  updatedBefore?: Date;
  updatedAfter?: Date;
};
