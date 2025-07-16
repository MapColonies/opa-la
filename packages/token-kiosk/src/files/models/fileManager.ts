import { injectable, inject } from 'tsyringe';
import { Cache, createCache } from 'async-cache-dedupe';
import { hoursToSeconds } from 'date-fns';
import { renderString } from 'nunjucks';
import type { components } from '@openapi';
import { SERVICES } from '@common/constants';
import { type ConfigType } from '@src/common/config';
import { TokenManager } from '@src/tokens/models/tokenManager';
import { CatalogClient, CatalogRecord, CatalogRecordIdentifier } from './catalogManager';
import qlrTemplate from './qlrTemplate';

type CatalogCache = Cache & {
  getRecords: typeof CatalogClient.prototype.getCatalogRecords;
};

const TTL_SECONDS = hoursToSeconds(1);

type LayerIdentifier = CatalogRecordIdentifier & {
  displayName?: string;
};

@injectable()
export class FileManager {
  private readonly cache: CatalogCache;
  private readonly layerIdentifiers: LayerIdentifier[];

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(TokenManager) private readonly tokenManager: TokenManager,
    @inject(CatalogClient) private readonly catalogClient: CatalogClient
  ) {
    this.cache = createCache({
      ttl: TTL_SECONDS,
      stale: 0,
      storage: { type: 'memory' },
    }).define('getRecords', this.catalogClient.getCatalogRecords.bind(this.catalogClient));

    this.layerIdentifiers = this.config.get('qlr.layers');
  }

  public async getFile(type: components['schemas']['fileTypes'], clientId: string, userDetails: Record<string, unknown>): Promise<string> {
    const tokenResult = await this.tokenManager.getToken(clientId, userDetails);
    const token = tokenResult.token;

    const layerData = await this.cache.getRecords(this.layerIdentifiers);

    if (type === 'qlr') {
      return this.getQlr(layerData, token);
    } else {
      throw new Error(`Unsupported file type: ${type}`);
    }
  }

  private getQlr(layers: CatalogRecord[], token: string): string {
    console.log(layers);
    return renderString(qlrTemplate, { layers, token });
  }
}
