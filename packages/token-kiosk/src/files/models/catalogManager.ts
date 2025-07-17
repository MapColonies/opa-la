import { injectable, inject } from 'tsyringe';
import { z } from 'zod/v4';
import { request } from 'undici';
import { XMLParser } from 'fast-xml-parser';
import { SERVICES } from '@common/constants';
import { type ConfigType } from '@src/common/config';

/* eslint-disable @typescript-eslint/no-magic-numbers */
const x = z.number().max(180).min(-180);
const y = z.number().max(90).min(-90);
/* eslint-enable @typescript-eslint/no-magic-numbers */

const productDescriptionSchema = z.object({
  productId: z.string(),
  productType: z.string(),
  displayName: z.string().optional(),
});

const catalogResponseSchema = z.object({
  ...productDescriptionSchema.shape,
  wmtsLink: z.object({
    name: z.string(),
    url: z.string(),
  }),
  mimeType: z.string(),
  boundingBox: z.object({
    minx: x,
    miny: y,
    maxx: x,
    maxy: y,
  }),
  id: z.string(),
});

interface LinkType {
  '@_scheme': string;
  '@_name': string;
  '#text': string;
}

interface RecordType {
  'mc:id': string;
  'mc:productId': string;
  'mc:productType': string;
  'mc:links': LinkType | LinkType[];
  'mc:mimeType': string;
  'ows:BoundingBox': {
    'ows:LowerCorner': string;
    'ows:UpperCorner': string;
  };
}

export type CatalogRecordIdentifier = z.infer<typeof productDescriptionSchema>;
export type CatalogRecord = z.infer<typeof catalogResponseSchema>;

@injectable()
export class CatalogClient {
  public constructor(@inject(SERVICES.CONFIG) private readonly config: ConfigType) {}

  public async getCatalogRecords(identifiers: CatalogRecordIdentifier[]): Promise<CatalogRecord[]> {
    const catalogUrl = this.config.get('qlr.catalogUrl');
    const results: CatalogRecord[] = [];

    for (const { productId, productType, displayName } of identifiers) {
      const xmlBody = this.buildRequestXml(productId, productType);
      const xmlResponse = await this.fetchCatalogResponse(catalogUrl, xmlBody);
      const record = this.parseCatalogRecord(xmlResponse);
      if (record) {
        record.displayName = displayName ?? productId;
        results.push(record);
      }
    }

    if (results.length === 0) {
      throw new Error('No records found for the provided layer identifiers');
    }
    return results;
  }

  private buildRequestXml(productId: string, productType: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" maxRecords="10" startPosition="1" outputSchema="http://schema.mapcolonies.com/raster" version="2.0.2" xmlns:mc="http://schema.mapcolonies.com/raster" >
  <csw:Query typeNames="mc:MCRasterRecord">
   <csw:ElementSetName>full</csw:ElementSetName>
    <csw:Constraint version="1.1.0">
      <Filter xmlns="http://www.opengis.net/ogc">
        <And>
          <PropertyIsEqualTo>
            <PropertyName>mc:productId</PropertyName>
            <Literal>${productId}</Literal>
          </PropertyIsEqualTo>
          <PropertyIsEqualTo>
            <PropertyName>mc:productType</PropertyName>
            <Literal>${productType}</Literal>
          </PropertyIsEqualTo>
        </And>
      </Filter>
    </csw:Constraint>
  </csw:Query>
</csw:GetRecords>`;
  }

  private async fetchCatalogResponse(catalogUrl: string, xmlBody: string): Promise<string> {
    const response = await fetch(catalogUrl, {
      method: 'POST',
      body: xmlBody,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    return response.text();
  }

  private parseCatalogRecord(xml: string): z.infer<typeof catalogResponseSchema> | null {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml) as {
      'csw:GetRecordsResponse': {
        'csw:SearchResults': {
          'mc:MCRasterRecord': RecordType;
        };
      };
    };

    const record = parsed['csw:GetRecordsResponse']['csw:SearchResults']['mc:MCRasterRecord'];

    const linksArr: LinkType[] = Array.isArray(record['mc:links']) ? record['mc:links'] : [record['mc:links']];

    const wmtsLinkObj = linksArr.find((l) => l['@_scheme'] === 'WMTS' && typeof l['@_name'] === 'string');
    const wmtsLink = {
      name: wmtsLinkObj ? wmtsLinkObj['@_name'] : '',
      url: wmtsLinkObj ? wmtsLinkObj['#text'] : '',
    };

    const boundingBox = record['ows:BoundingBox'];
    const [miny, minx] = boundingBox['ows:LowerCorner'].split(' ').map(Number);
    const [maxy, maxx] = boundingBox['ows:UpperCorner'].split(' ').map(Number);

    const result = {
      id: record['mc:id'],
      productId: record['mc:productId'],
      productType: record['mc:productType'],
      wmtsLink,
      mimeType: record['mc:mimeType'],
      boundingBox: { minx, miny, maxx, maxy },
    };
    return catalogResponseSchema.parse(result);
  }
}
