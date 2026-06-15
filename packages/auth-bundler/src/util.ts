export function extractNameAndVersion<T extends { name: string; version: number }>(entities: T[]): [string[], number[]] {
  const names: string[] = [];
  const versions: number[] = [];
  for (const entity of entities) {
    names.push(entity.name);
    versions.push(entity.version);
  }
  return [names, versions];
}
