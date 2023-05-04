export function extractNameAndVersion<T extends { name: string; version: number }>(entities: T[]): { name: string; version: number }[] {
  return entities.map((a) => ({ name: a.name, version: a.version }));
}
