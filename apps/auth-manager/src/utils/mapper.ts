export type ShallowRemoveNulls<T> = {
  [K in keyof T as null extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as null extends T[K] ? K : never]?: Exclude<T[K], null>;
} extends infer O
  ? { [K in keyof O]: O[K] }
  : never;

export function removeNulls<T extends object>(obj: T): ShallowRemoveNulls<T> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      const value = obj[key];
      if (value !== null) {
        result[key] = value;
      }
    }
  }

  return result as ShallowRemoveNulls<T>;
}
