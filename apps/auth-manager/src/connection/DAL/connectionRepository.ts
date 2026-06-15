import { and, eq, max } from 'drizzle-orm';
import { connectionTable, type Connection, type Drizzle, type DrizzleTx } from '@map-colonies/auth-core';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { SERVICES } from '@common/constants';

@scoped(Lifecycle.ContainerScoped)
export class ConnectionRepository {
  public constructor(@inject(SERVICES.DRIZZLE) private readonly db: Drizzle) {}

  public async getMaxVersionWithLock(name: string, environment: Connection['environment'], tx: DrizzleTx): Promise<number | null> {
    const subQuery = tx
      .select({ maxVersion: max(connectionTable.version) })
      .from(connectionTable)
      .where(and(eq(connectionTable.name, name), eq(connectionTable.environment, environment)));

    const result = await tx
      .select({ version: connectionTable.version })
      .from(connectionTable)
      .where(and(eq(connectionTable.name, name), eq(connectionTable.environment, environment), eq(connectionTable.version, subQuery)))
      .for('update')
      .limit(1);

    return result[0]?.version ?? null;
  }

  public async getMaxVersion(name: string, environment: Connection['environment'], tx?: DrizzleTx): Promise<number | null> {
    const db = tx ?? this.db;

    const result = await db
      .select({ version: max(connectionTable.version) })
      .from(connectionTable)
      .where(and(eq(connectionTable.name, name), eq(connectionTable.environment, environment)));

    return result[0]?.version ?? null;
  }
}
