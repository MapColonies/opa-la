import { SortQueryInvalidFieldError, SortQueryRepeatError } from '../errors';

export type SortOptions<T extends object> = {
  [key in keyof T]?: 'asc' | 'desc';
};

export function sortOptionParser<T extends object>(sortArray: string[] | undefined, sortFieldsMap: Map<string, keyof T>): SortOptions<T> {
  if (!sortArray) {
    return {};
  }

  const parsedOptions: SortOptions<T> = {};
  const fieldSet = new Set<string>();

  for (const option of sortArray) {
    const [field, order] = option.split(':') as [string, 'asc' | 'desc' | undefined]; // we assume that the options are already validated by the openapi validator;

    if (fieldSet.has(field)) {
      throw new SortQueryRepeatError(`Duplicate field in sort query: ${field}`);
    }
    fieldSet.add(field);

    const parsedField = sortFieldsMap.get(field);

    if (parsedField === undefined) {
      throw new SortQueryInvalidFieldError(`Invalid field in sort query: ${field}`);
    }

    parsedOptions[parsedField] = order ?? 'asc';
  }

  return parsedOptions;
}
