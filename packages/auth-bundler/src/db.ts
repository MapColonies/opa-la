import { DataSource, Repository } from 'typeorm';
import { Asset, Bundle, Connection, Environments, Key } from '@map-colonies/auth-core';
import { BundleContent, BundleContentVersions } from './types';
import { extractNameAndVersion } from './util';
import { logger } from './logger';
import { ConnectionNotInitializedError, KeyNotFoundError } from './errors';
import { getVersionCommand } from './opa';

/**
 * This class handles all the database interactions required to creating a bundle.
 */
export class BundleDatabase {
  private readonly assetRepository: Repository<Asset>;
  private readonly keyRepository: Repository<Key>;
  private readonly connectionRepository: Repository<Connection>;
  private readonly bundleRepository: Repository<Bundle>;

  /**
   * Initializes the class for communication with the database.
   * The dataSource should point to a database initialized with the model defined in the auth-core package.
   * @param dataSource The typeorm dataSource to use in the class
   * @see {@link https://typeorm.io/data-source}
   * @throws {@link ConnectionNotInitializedError} If the dataSource is not initialized.
   */
  public constructor(private readonly dataSource: DataSource) {
    if (!dataSource.isInitialized) {
      throw new ConnectionNotInitializedError('DB connection it not initialized');
    }
    this.assetRepository = dataSource.getRepository(Asset);
    this.keyRepository = dataSource.getRepository(Key);
    this.connectionRepository = dataSource.getRepository(Connection);
    this.bundleRepository = dataSource.getRepository(Bundle);
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

  /**
   * Saved the metadata of the bundle into the database
   * @param versions The versions of the bundle content
   * @param hash The md5 hash of the created bundle tarball
   * @returns The ID of the created bundle
   */
  public async saveBundle(versions: BundleContentVersions, hash: string): Promise<number> {
    logger?.debug('saving bundle to db');
    const bundle: Omit<Bundle, 'id'> = {
      environment: versions.environment,
      assets: versions.assets,
      connections: versions.connections,
      keyVersion: versions.keyVersion,
      hash,
      opaVersion: await getVersionCommand(),
    };

    const res = await this.bundleRepository.save(bundle);
    return res.id;
  }

  /**
   * Retrieves the values of the assets, connections and key based on the supplied versions
   * @param versions The requested versions to be retrieved
   * @returns All the values based on the supplied versions
   */
  public async getBundleFromVersions(versions: BundleContentVersions): Promise<BundleContent> {
    logger?.debug('fetching bundle from the db');

    const assets = this.dataSource
      .getRepository(Asset)
      .createQueryBuilder()
      .whereInIds(extractNameAndVersion(versions.assets))
      .andWhere(':env = ANY(environment)', { env: versions.environment })
      .getMany();

    const connections = this.dataSource
      .getRepository(Connection)
      .createQueryBuilder()
      .whereInIds(extractNameAndVersion(versions.connections))
      .andWhere(':env = environment', { env: versions.environment })
      .getMany();

    const key =
      versions.keyVersion !== undefined
        ? this.dataSource.getRepository(Key).findOneByOrFail({ environment: versions.environment, version: versions.keyVersion })
        : undefined;

    const promises = await Promise.all([assets, connections, key]);

    return { assets: promises[0], connections: promises[1], key: promises[2], environment: versions.environment };
  }

  private async getAssetsVersions(environment: string): Promise<{ name: string; version: number }[]> {
    const subQuery = this.assetRepository
      .createQueryBuilder('asset')
      .select(['name', 'MAX(version)'])
      .where(':environment = ANY (environment)', { environment })
      .groupBy('name');

    return this.assetRepository
      .createQueryBuilder('asset')
      .select(['name', 'version'])
      .where(':environment = ANY (environment)', { environment })
      .andWhere('(name, version) IN (' + subQuery.getQuery() + ')')
      .orderBy('name')
      .getRawMany<{ name: string; version: number }>();
  }

  private async getLatestKeyVersion(environment: string): Promise<number | null> {
    const res = await this.keyRepository
      .createQueryBuilder('key')
      .select('MAX(version) as version')
      .where('environment = :environment', { environment })
      .getRawOne<{ version: number | null }>();

    if (res === undefined) {
      throw new KeyNotFoundError(`couldn't not find a key for environment: ${environment}`);
    }

    return res.version;
  }

  private async getConnectionsVersions(environment: string): Promise<{ name: string; version: number }[]> {
    const subQuery = this.connectionRepository
      .createQueryBuilder('connection')
      .select(['name', 'MAX(version)'])
      .where(':environment = environment', { environment })
      .groupBy('name');

    return this.connectionRepository
      .createQueryBuilder('connection')
      .select(['name', 'version'])
      .where(':environment = environment AND enabled = TRUE')
      .andWhere('(name, version) IN (' + subQuery.getQuery() + ')')
      .orderBy('name')
      .setParameters(subQuery.getParameters())
      .getRawMany<{ name: string; version: number }>();
  }
}
