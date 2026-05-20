import { and, eq, max } from 'drizzle-orm';
import { keyTable, type Key, type Drizzle, type DrizzleTx } from '@map-colonies/auth-core';
import { inject, injectable, Lifecycle, scoped } from 'tsyringe';
import { SERVICES } from '@common/constants';

@scoped(Lifecycle.ContainerScoped)
export class KeyRepository {
  public constructor(@inject(SERVICES.DRIZZLE) private readonly db: Drizzle) {}

  public async getMaxVersionWithLock(env: Key['environment'], tx: DrizzleTx): Promise<number | null> {
    const subQuery = tx
      .select({ maxVersion: max(keyTable.version) })
      .from(keyTable)
      .where(eq(keyTable.environment, env));

    const result = await tx
      .select({ version: keyTable.version })
      .from(keyTable)
      .where(and(eq(keyTable.environment, env), eq(keyTable.version, subQuery)))
      .for('update')
      .limit(1);

    return result[0]?.version ?? null;
  }

  public async getMaxVersion(env: Key['environment'], tx?: DrizzleTx): Promise<number | null> {
    const db = tx ?? this.db;

    const result = await db
      .select({ version: max(keyTable.version) })
      .from(keyTable)
      .where(eq(keyTable.environment, env));

    return result[0]?.version ?? null;
  }

  public async getLatestKeys(tx?: DrizzleTx): Promise<Key[]> {
    const db = tx ?? this.db;
    const maxVersionsSubQuery = db
      .select({ environment: keyTable.environment, version: max(keyTable.version).as('version') })
      .from(keyTable)
      .groupBy(keyTable.environment)
      .as('max_keys');

    return db
      .select({
        environment: keyTable.environment,
        version: keyTable.version,
        privateKey: keyTable.privateKey,
        publicKey: keyTable.publicKey,
      })
      .from(keyTable)
      .innerJoin(
        maxVersionsSubQuery,
        and(eq(keyTable.version, maxVersionsSubQuery.version), eq(keyTable.environment, maxVersionsSubQuery.environment))
      );
  }
}
