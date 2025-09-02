import { CatalogRecord } from './catalogManager';

function createLayerDefinition(record: CatalogRecord, token: string): object {
  return {
    type: 'CIMTiledServiceLayer',
    name: record.displayName,
    uRI: `CIMPATH=Map/${record.productId}_.json`,
    sourceModifiedTime: {
      type: 'TimeInstant',
    },
    useSourceMetadata: true,
    description: 'MapColonies layers',
    layerType: 'Operational',
    showLegends: true,
    visibility: true,
    displayCacheType: 'Permanent',
    maxDisplayCacheAge: 5,
    showPopups: true,
    serviceLayerID: -1,
    refreshRate: -1,
    refreshRateUnits: 'esriTimeUnitsSeconds',
    blendingMode: 'Alpha',
    allowDrapingOnIntegrateMesh: true,
    serviceConnection: {
      type: 'CIMWMTSServiceConnection',
      layerName: record.wmtsLink.name,
      version: '1.0.0',
      serverConnection: {
        type: 'CIMProjectServerConnection',
        anonymous: true,
        hideUserProperty: true,
        url: record.wmtsLink.url,
        connectionMode: 'Consumer',
        serverType: 'WMTS',
        useDefaultStagingFolder: true,
      },
      style: 'default',
      imageFormat: record.mimeType,
      capabilitiesParameters: {
        type: 'PropertySet',
        propertySetItems: ['token', token],
      },
    },
  };
}

export function createLyrxFile(layers: CatalogRecord[], token: string): object {
  return {
    type: 'CIMLayerDocument',
    version: '3.0.2',
    build: 55405,
    layers: layers.map((layer) => `CIMPATH=Map/${layer.productId}_.json`),
    layerDefinitions: layers.map((layer) => createLayerDefinition(layer, token)),
  };
}
