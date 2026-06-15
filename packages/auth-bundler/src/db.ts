import type { Pool } from 'pg';
import { sql, type SQL, type AnyColumn, and, arrayContains, max, eq } from 'drizzle-orm';
import { assetTable, createDrizzle, bundleTable, connectionTable, keyTable } from '@map-colonies/auth-core';
import type { Environments, NewBundle, Drizzle, Bundle } from '@map-colonies/auth-core';
import type { BundleContent, BundleContentVersions } from './types';
import { extractNameAndVersion } from './util';
import { logger } from './logger';
import { KeyNotFoundError } from './errors';
import { getVersionCommand } from './opa';

// TypeScript Magic: Maps an array of columns to an array of *arrays* of those column types
// [Column<number>, Column<string>] becomes [number[], string[]]
type InferTransposedArrays<T extends AnyColumn[]> = {
  [K in keyof T]: T[K] extends AnyColumn ? T[K]['_']['data'][] : never;
};

/**
 * A composite IN filter using Postgres unnest() with explicit type casting.
 */
function inCompositeUnnest<T extends AnyColumn[]>(columns: [...T], transposedValues: [...InferTransposedArrays<T>]): SQL {
  // Guard clause
  if (transposedValues[0].length === 0) {
    return sql`false`;
  }

  const columnList = sql.join(
    columns.map((col) => sql`${col}`),
    sql`, `
  );

  // Map each array parameter to its explicit Postgres array type cast
  const unnestArgs = sql.join(
    transposedValues.map((arr, index) => {
      const col = columns[index];
      let sqlType = col.getSQLType();

      // Postgres pseudo-types handling (e.g., 'serial' cannot be cast as 'serial[]')
      if (sqlType === 'serial') sqlType = 'integer';
      if (sqlType === 'bigserial') sqlType = 'bigint';
      if (sqlType === 'smallserial') sqlType = 'smallint';

      // Safely append [] to the SQL type string using sql.raw
      return sql`${sql.param(arr)}::${sql.raw(sqlType)}[]`;
    }),
    sql`, `
  );

  return sql`(${columnList}) IN (SELECT * FROM unnest(${unnestArgs}))`;
}

/**
 * This class handles all the database interactions required to creating a bundle.
 */
export class BundleDatabase {
  private readonly drizzle: Drizzle;

  /**
   * Initializes the class for communication with the database.
   * The dataSource should point to a database initialized with the model defined in the auth-core package.
   * @throws {@link ConnectionNotInitializedError} If the dataSource is not initialized.
   */
  public constructor(pool: Pool) {
    this.drizzle = createDrizzle(pool);
  }

  /**
   * Retrieves all the latest assets, connections and key versions based on requested environment
   * @param env The environment for which to retrieve the versions
   * @returns An object describing all the latest versions
   */
  public async getLatestVersions(env: Environments): Promise<BundleContentVersions> {
    logger?.debug('fetching latest versions from the db');
    return {
      environment: env,
      assets: await this.getAssetsVersions(env),
      connections: await this.getConnectionsVersions(env),
      keyVersion: (await this.getLatestKeyVersion(env)) ?? undefined,
    };
  }

  public async getLatestBundleByEnv(env: Environments): Promise<Bundle | null> {
    const bundle = await this.drizzle.query.bundle.findFirst({
      where: { environment: env },
      orderBy: { id: 'desc' },
    });
    return bundle ?? null;
  }

  /**
   * Saved the metadata of the bundle into the database
   * @param versions The versions of the bundle content
   * @param hash The md5 hash of the created bundle tarball
   * @returns The ID of the created bundle
   */
  public async saveBundle(versions: BundleContentVersions, hash: string): Promise<number> {
    logger?.debug('saving bundle to db');
    const bundle: NewBundle = {
      environment: versions.environment,
      assets: versions.assets,
      connections: versions.connections,
      keyVersion: versions.keyVersion,
      hash,
      opaVersion: await getVersionCommand(),
    };

    const res = await this.drizzle.insert(bundleTable).values(bundle).returning();
    return res[0]?.id as number;
  }

  /**
   * Retrieves the values of the assets, connections and key based on the supplied versions
   * @param versions The requested versions to be retrieved
   * @returns All the values based on the supplied versions
   */
  public async getBundleFromVersions(versions: BundleContentVersions): Promise<BundleContent> {
    logger?.debug('fetching bundle from the db');

    const assetsQuery = this.drizzle
      .select()
      .from(assetTable)
      .where(
        and(
          inCompositeUnnest([assetTable.name, assetTable.version], extractNameAndVersion(versions.assets)),
          arrayContains(assetTable.environment, [versions.environment])
        )
      );

    const connectionsQuery = this.drizzle
      .select()
      .from(connectionTable)
      .where(
        and(
          inCompositeUnnest([connectionTable.name, connectionTable.version], extractNameAndVersion(versions.connections)),
          sql`${connectionTable.environment} = ${versions.environment}`
        )
      );

    const keyQuery =
      versions.keyVersion !== undefined
        ? this.drizzle.query.key.findFirst({ where: { environment: versions.environment, version: versions.keyVersion } })
        : undefined;

    const assets = await assetsQuery;
    const connections = await connectionsQuery;
    const key = await keyQuery;
    const promises = [assets, connections, key] as const;

    return { assets: promises[0], connections: promises[1], key: promises[2], environment: versions.environment };
  }

  private async getAssetsVersions(environment: Environments): Promise<{ name: string; version: number }[]> {
    const subQuery = this.drizzle
      .select({ name: assetTable.name, version: max(assetTable.version) })
      .from(assetTable)
      .where(arrayContains(assetTable.environment, [environment]))
      .groupBy(assetTable.name);

    return this.drizzle
      .select({ name: assetTable.name, version: assetTable.version })
      .from(assetTable)
      .where(and(arrayContains(assetTable.environment, [environment]), sql`(${assetTable.name}, ${assetTable.version}) IN (${subQuery})`))
      .orderBy(assetTable.name);
  }

  private async getLatestKeyVersion(environment: Environments): Promise<number | null> {
    const res = await this.drizzle
      .select({ version: max(keyTable.version) })
      .from(keyTable)
      .where(eq(keyTable.environment, environment));

    if (res[0] === undefined) {
      throw new KeyNotFoundError(`couldn't not find a key for environment: ${environment}`);
    }

    return res[0].version;
  }

  private async getConnectionsVersions(environment: Environments): Promise<{ name: string; version: number }[]> {
    const subQuery = this.drizzle
      .select({ name: connectionTable.name, version: max(connectionTable.version) })
      .from(connectionTable)
      .where(eq(connectionTable.environment, environment))
      .groupBy(connectionTable.name)
      .$dynamic();

    return this.drizzle
      .select({ name: connectionTable.name, version: connectionTable.version })
      .from(connectionTable)
      .where(
        and(
          eq(connectionTable.environment, environment),
          sql`(${connectionTable.name}, ${connectionTable.version}) IN (${subQuery})`,
          eq(connectionTable.enabled, true)
        )
      )
      .orderBy(connectionTable.name);
  }
}
