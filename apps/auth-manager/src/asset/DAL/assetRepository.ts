import { and, desc, eq, max } from 'drizzle-orm';
import { assetTable, type DrizzleTx, type Drizzle } from '@map-colonies/auth-core';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { SERVICES } from '@common/constants';

@scoped(Lifecycle.ContainerScoped)
export class AssetRepository {
  public constructor(@inject(SERVICES.DRIZZLE) private readonly db: Drizzle) {}

  public async getMaxVersionWithLock(name: string, tx: DrizzleTx): Promise<number | null> {
    const result = await tx
      .select({ version: assetTable.version })
      .from(assetTable)
      .where(eq(assetTable.name, name))
      .orderBy(desc(assetTable.version))
      .limit(1)
      .for('update');

    return result[0]?.version ?? null;
  }

  public async getMaxVersion(name: string, tx?: DrizzleTx): Promise<number | null> {
    const db = tx ?? this.db;

    const result = await db
      .select({ version: max(assetTable.version) })
      .from(assetTable)
      .where(eq(assetTable.name, name));

    return result[0]?.version ?? null;
  }
}
