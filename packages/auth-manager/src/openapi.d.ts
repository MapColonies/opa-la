/* eslint-disable */
import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';
export type paths = {
  '/client': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** gets clients by filtering */
    get: operations['getClients'];
    put?: never;
    /** creates a new client */
    post: operations['createClient'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/client/{clientName}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
      };
      cookie?: never;
    };
    /** get client by name */
    get: operations['getClient'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** update the client */
    patch: operations['updateClient'];
    trace?: never;
  };
  '/client/{clientName}/connection': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
      };
      cookie?: never;
    };
    /** gets the connections for a specific client */
    get: operations['getClientConnections'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/client/{clientName}/connection/{environment}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
        environment: components['parameters']['environmentPathParam'];
      };
      cookie?: never;
    };
    /** get the latest client connection for specific environment */
    get: operations['getClientEnvironmentConnections'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/client/{clientName}/connection/{environment}/{version}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
        environment: components['parameters']['environmentPathParam'];
        version: components['parameters']['versionParam'];
      };
      cookie?: never;
    };
    /** get a specfic client connection for specific environment */
    get: operations['getClientVersionedConnection'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/client/{clientName}/connection/{environment}/latest': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
        environment: components['parameters']['environmentPathParam'];
      };
      cookie?: never;
    };
    /** get the latest client connection for specific environment */
    get: operations['getClientLatestConnection'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/connection': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** get a connections based on filters */
    get: operations['getConnections'];
    put?: never;
    /** creates a new connection or updates it based on the version */
    post: operations['upsertConnection'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/key': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** get all latest keys */
    get: operations['getLastestKeys'];
    put?: never;
    /** creates a new key or updates it based on the version */
    post: operations['upsertKey'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/key/{environment}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        environment: components['parameters']['environmentPathParam'];
      };
      cookie?: never;
    };
    /** get keys for specific environment */
    get: operations['getKeys'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/key/{environment}/{version}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        environment: components['parameters']['environmentPathParam'];
        version: components['parameters']['versionParam'];
      };
      cookie?: never;
    };
    /** gets a specific key */
    get: operations['getSpecificKey'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/key/{environment}/latest': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        environment: components['parameters']['environmentPathParam'];
      };
      cookie?: never;
    };
    /** gets the latest key for specific environment */
    get: operations['getLatestKey'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/asset': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** get assets by filters */
    get: operations['getAssets'];
    put?: never;
    /** creates a new asset or updates it based on the version */
    post: operations['upsertAsset'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/asset/{assetName}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assetName: components['parameters']['assetParam'];
      };
      cookie?: never;
    };
    /** get asset by name */
    get: operations['getAsset'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/asset/{assetName}/{version}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assetName: components['parameters']['assetParam'];
        version: components['parameters']['versionParam'];
      };
      cookie?: never;
    };
    /** get asset by name and version */
    get: operations['getVersionedAsset'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/asset/{assetName}/latest': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assetName: components['parameters']['assetParam'];
      };
      cookie?: never;
    };
    /** get latest asset by name */
    get: operations['getLatestAsset'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/bundle': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** get bundles by filter */
    get: operations['getBundles'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/bundle/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    /** get a specific bundle */
    get: operations['getBundle'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/domain': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** get all the domains */
    get: operations['getDomains'];
    put?: never;
    /** create a new domain */
    post: operations['createDomain'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    error: {
      message: string;
    };
    /** @enum {string} */
    environment: 'np' | 'stage' | 'prod';
    /**
     * Format: int32
     * @default 1
     */
    version: number;
    /** @enum {string} */
    assetType: 'TEST' | 'TEST_DATA' | 'POLICY' | 'DATA';
    name: string;
    domain: {
      name: components['schemas']['name'];
    };
    pointOfContact: {
      name: components['schemas']['name'];
      /** Format: email */
      email: string;
      /** Format: phone */
      phone: string;
    };
    namelessClient: {
      hebName: components['schemas']['name'];
      description?: string;
      branch?: string;
      /** Format: date-time */
      readonly createdAt: string;
      /** Format: date-time */
      readonly updatedAt: string;
      techPointOfContact?: components['schemas']['pointOfContact'];
      productPointOfContact?: components['schemas']['pointOfContact'];
      tags?: string[];
    };
    client: components['schemas']['namelessClient'] & {
      name: components['schemas']['name'];
    };
    connection: {
      name: components['schemas']['name'];
      environment: components['schemas']['environment'];
      version: components['schemas']['version'];
      /** @default true */
      enabled: boolean;
      token: string;
      domains: string[];
      /** Format: date-time */
      readonly createdAt?: string;
      allowNoBrowserConnection: boolean;
      allowNoOriginConnection: boolean;
      origins: string[];
    };
    publicJWK: {
      kty: string;
      n: string;
      e: string;
      alg: string;
      kid: string;
    };
    privateJWK: components['schemas']['publicJWK'] & {
      d: string;
      p: string;
      q: string;
      dp: string;
      dq: string;
      qi: string;
    };
    key: {
      publicKey: components['schemas']['publicJWK'];
      privateKey: components['schemas']['privateJWK'];
      version: components['schemas']['version'];
      environment: components['schemas']['environment'];
    };
    asset: {
      environment: components['schemas']['environment'][];
      /** Format: date-time */
      readonly createdAt: string;
      /** Format: byte */
      value: string;
      uri: string;
      type: components['schemas']['assetType'];
      /** @default false */
      isTemplate: boolean;
      version: components['schemas']['version'];
      name: string;
    };
    bundle: {
      /** Format: int32 */
      id?: number;
      hash?: string;
      metadata?: {
        [key: string]: unknown;
      };
      assets?: {
        name: string;
        version: components['schemas']['version'];
      }[];
      connections?: {
        name: string;
        version: components['schemas']['version'];
      }[];
      environment?: components['schemas']['environment'] & unknown;
      /** Format: date-time */
      readonly createdAt?: string;
      keyVersion?: components['schemas']['version'];
      /** @description OPA version used to generate the bundle */
      opaVersion?: string;
    };
    paginationResponse: {
      /**
       * Format: int32
       * @description total number of items
       */
      total: number;
    };
  };
  responses: {
    /** @description BadRequest */
    '400BadRequest': {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description Not Found - If client does not exist */
    '404NotFound': {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description conflict */
    '409Conflict': {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description Unsupported Media Type */
    '415UnsupportedMediaType': {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description Internal Server Error */
    '500InternalServerError': {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
  };
  parameters: {
    /** @description page number for pagination. The value is 1-based, meaning the first page is 1.
     *     If the value is greater than the total number of pages, an empty array will be returned.
     *     This simplifies the pagination logic on the client side.
     *      */
    page: number;
    /** @description number of items per page */
    pageSize: number;
    clientParam: string;
    assetParam: string;
    versionParam: components['schemas']['version'];
    environmentQueryParam: components['schemas']['environment'][];
    environmentPathParam: components['schemas']['environment'];
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
  getClients: {
    parameters: {
      query?: {
        /** @description search by branch name */
        branch?: string;
        /** @description filters all clients created before given date */
        createdBefore?: string;
        /** @description filters all clients created after given date */
        createdAfter?: string;
        /** @description filters all clients updated before given date */
        updatedBefore?: string;
        /** @description filters all clients updated after given date */
        updatedAfter?: string;
        /** @description filters based on tags */
        tags?: string[];
        /**
         * @description Sorts the results based on the value of one or more properties.
         *     The value is a comma-separated list of property names and sort order.
         *     properties should be separated by a colon and sort order should be either asc or desc. For example: created-at:asc,name:asc
         *     The default sort order is ascending. If the sort order is not specified, the default sort order is used. Each property is only allowed to appear once in the list.
         *     The available properties are:
         *     - created-at
         *     - updated-at
         *     - name
         *     - heb-name
         *     - branch
         * @example [
         *       "created-at:asc",
         *       "name:asc"
         *     ]
         */
        sort?: string[];
        /** @description page number for pagination. The value is 1-based, meaning the first page is 1.
         *     If the value is greater than the total number of pages, an empty array will be returned.
         *     This simplifies the pagination logic on the client side.
         *      */
        page?: components['parameters']['page'];
        /** @description number of items per page */
        page_size?: components['parameters']['pageSize'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['paginationResponse'] & {
            /** @description list of clients */
            items: components['schemas']['client'][];
          };
        };
      };
      400: components['responses']['400BadRequest'];
      500: components['responses']['500InternalServerError'];
    };
  };
  createClient: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['client'];
      };
    };
    responses: {
      /** @description created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['client'];
        };
      };
      400: components['responses']['400BadRequest'];
      409: components['responses']['409Conflict'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getClient: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['client'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  updateClient: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['namelessClient'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['client'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getClientConnections: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['connection'][];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getClientEnvironmentConnections: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
        environment: components['parameters']['environmentPathParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['connection'][];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getClientVersionedConnection: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
        environment: components['parameters']['environmentPathParam'];
        version: components['parameters']['versionParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['connection'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getClientLatestConnection: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        clientName: components['parameters']['clientParam'];
        environment: components['parameters']['environmentPathParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['connection'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getConnections: {
    parameters: {
      query?: {
        environment?: components['parameters']['environmentQueryParam'];
        isEnabled?: boolean;
        isNoBrowser?: boolean;
        isNoOrigin?: boolean;
        domains?: string[];
        /**
         * @description Sorts the results based on the value of one or more properties.
         *     The value is a comma-separated list of property names and sort order.
         *     properties should be separated by a colon and sort order should be either asc or desc. For example: created-at:asc,name:asc
         *     The default sort order is ascending. If the sort order is not specified, the default sort order is used. Each property is only allowed to appear once in the list.
         *     The available properties are:
         *     - created-at
         *     - name
         *     - version
         *     - enabled
         *     - environment
         * @example [
         *       "created-at:asc",
         *       "name:asc"
         *     ]
         */
        sort?: string[];
        /** @description page number for pagination. The value is 1-based, meaning the first page is 1.
         *     If the value is greater than the total number of pages, an empty array will be returned.
         *     This simplifies the pagination logic on the client side.
         *      */
        page?: components['parameters']['page'];
        /** @description number of items per page */
        page_size?: components['parameters']['pageSize'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['paginationResponse'] & {
            /** @description list of clients */
            items: components['schemas']['connection'][];
          };
        };
      };
      400: components['responses']['400BadRequest'];
      500: components['responses']['500InternalServerError'];
    };
  };
  upsertConnection: {
    parameters: {
      query?: {
        shouldIgnoreTokenErrors?: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['connection'];
      };
    };
    responses: {
      /** @description updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['connection'];
        };
      };
      /** @description created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['connection'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      409: components['responses']['409Conflict'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getLastestKeys: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['key'][];
        };
      };
      415: components['responses']['415UnsupportedMediaType'];
      500: components['responses']['500InternalServerError'];
    };
  };
  upsertKey: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['key'];
      };
    };
    responses: {
      /** @description updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['key'];
        };
      };
      /** @description created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['key'];
        };
      };
      400: components['responses']['400BadRequest'];
      409: components['responses']['409Conflict'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getKeys: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        environment: components['parameters']['environmentPathParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['key'][];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getSpecificKey: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        environment: components['parameters']['environmentPathParam'];
        version: components['parameters']['versionParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['key'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getLatestKey: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        environment: components['parameters']['environmentPathParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['key'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getAssets: {
    parameters: {
      query?: {
        environment?: components['parameters']['environmentQueryParam'];
        type?: components['schemas']['assetType'];
        isTemplate?: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['asset'][];
        };
      };
      400: components['responses']['400BadRequest'];
      500: components['responses']['500InternalServerError'];
    };
  };
  upsertAsset: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['asset'];
      };
    };
    responses: {
      /** @description updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['asset'];
        };
      };
      /** @description created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['asset'];
        };
      };
      400: components['responses']['400BadRequest'];
      409: components['responses']['409Conflict'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getAsset: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assetName: components['parameters']['assetParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['asset'][];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getVersionedAsset: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assetName: components['parameters']['assetParam'];
        version: components['parameters']['versionParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['asset'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getLatestAsset: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assetName: components['parameters']['assetParam'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['asset'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['404NotFound'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getBundles: {
    parameters: {
      query?: {
        /** @description filters all clients created before given date */
        createdBefore?: string;
        /** @description filters all clients created after given date */
        createdAfter?: string;
        environment?: components['parameters']['environmentQueryParam'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['bundle'][];
        };
      };
      400: components['responses']['400BadRequest'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getBundle: {
    parameters: {
      query?: {
        environment?: components['parameters']['environmentQueryParam'];
      };
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['bundle'];
        };
      };
      400: components['responses']['400BadRequest'];
      404: components['responses']['400BadRequest'];
      500: components['responses']['500InternalServerError'];
    };
  };
  getDomains: {
    parameters: {
      query?: {
        /**
         * @description Sorts the results based on the value of one or more properties.
         *     The value is a comma-separated list of property names and sort order.
         *     properties should be separated by a colon and sort order should be either asc or desc. For example: domain:asc
         *     The default sort order is ascending. If the sort order is not specified, the default sort order is used. Each property is only allowed to appear once in the list.
         *     The available properties are:
         *     - domain
         * @example [
         *       "domain:asc"
         *     ]
         */
        sort?: string[];
        /** @description page number for pagination. The value is 1-based, meaning the first page is 1.
         *     If the value is greater than the total number of pages, an empty array will be returned.
         *     This simplifies the pagination logic on the client side.
         *      */
        page?: components['parameters']['page'];
        /** @description number of items per page */
        page_size?: components['parameters']['pageSize'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['paginationResponse'] & {
            /** @description list of clients */
            items: components['schemas']['domain'][];
          };
        };
      };
      415: components['responses']['415UnsupportedMediaType'];
      500: components['responses']['500InternalServerError'];
    };
  };
  createDomain: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['domain'];
      };
    };
    responses: {
      /** @description created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['domain'];
        };
      };
      400: components['responses']['400BadRequest'];
      409: components['responses']['409Conflict'];
      500: components['responses']['500InternalServerError'];
    };
  };
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
