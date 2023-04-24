import { DataSource, Repository } from 'typeorm';
import { Asset, Bundle, Connection, Environment, Key } from '@map-colonies/auth-core';
import { BundleContent, BundleContentVersions } from './types';
import { extractNameAndVersion } from './util';

export class BundleDatabase {
  private readonly assetRepository: Repository<Asset>;
  private readonly keyRepository: Repository<Key>;
  private readonly connectionRepository: Repository<Connection>;
  private readonly bundleRepository: Repository<Bundle>;

  public constructor(private readonly dataSource: DataSource) {
    if (!dataSource.isInitialized) {
      throw new Error('DB connection it not initialized');
    }
    this.assetRepository = dataSource.getRepository(Asset);
    this.keyRepository = dataSource.getRepository(Key);
    this.connectionRepository = dataSource.getRepository(Connection);
    this.bundleRepository = dataSource.getRepository(Bundle);
  }

  public async getLatestVersions(env: Environment): Promise<BundleContentVersions> {
    return {
      environment: env,
      assets: await this.getAssetsVersions(env),
      connections: await this.getConnectionsVersions(env),
      keyVersion: (await this.getLatestKeyVersion(env)) ?? undefined,
    };
  }

  public async saveBundle(versions: BundleContentVersions, hash:string): Promise<number> {
    const bundle: Omit<Bundle, 'id'> = {
      environment: versions.environment,
      assets: versions.assets,
      connections: versions.connections,
      keyVersion: versions.keyVersion,
      hash,
    };

    const res = await this.bundleRepository.save(bundle);
    return res.id;
  }

  public async getBundleFromVersions(versions: BundleContentVersions): Promise<BundleContent> {
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
      // .where(':environment = ANY (environment)', { environment })
      .groupBy('name');

    return (
      this.assetRepository
        .createQueryBuilder('asset')
        .select(['name', 'version'])
        .where(':environment = ANY (environment)', { environment })
        .andWhere('(name, version) IN (' + subQuery.getQuery() + ')')
        .orderBy('name')
        // .setParameters(subQuery.getParameters())
        .getRawMany<{ name: string; version: number }>()
    );
  }

  private async getLatestKeyVersion(environment: string): Promise<number | null> {
    const res = await this.keyRepository
      .createQueryBuilder('key')
      .select('MAX(version) as version')
      .where('environment = :environment', { environment })
      .getRawOne<{ version: number | null }>();

    if (res === undefined) {
      throw new Error();
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
