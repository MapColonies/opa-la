/* eslint-disable */
import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';
export type paths = {
  '/token': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** generated and returns a temporary access token for the MapColonies services. */
    get: operations['getToken'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get current authenticated user information
     * @description Returns information about the currently authenticated user
     */
    get: operations['getCurrentUser'];
    put?: never;
    post?: never;
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
    tokenResponse: {
      /** @description Temporary access token for MapColonies services */
      token: string;
      /**
       * Format: date-time
       * @description Expiration date and time of the token
       */
      expiration: string;
    };
    userInfo: {
      /** @description Unique user identifier (subject) */
      sub: string;
      /** @description User display name */
      name?: string;
      /** @description User first name */
      given_name?: string;
      /** @description User last name */
      family_name?: string;
      /** @description User middle name */
      middle_name?: string;
      /** @description User nickname */
      nickname?: string;
      /** @description User preferred username */
      preferred_username?: string;
      /**
       * Format: email
       * @description User email address
       */
      email?: string;
      /** @description User gender */
      gender?: string;
      /** @description User phone number */
      phone_number?: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
  getToken: {
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
          'application/json': components['schemas']['tokenResponse'];
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  getCurrentUser: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description User information retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['userInfo'];
        };
      };
      /** @description Unauthorized - No valid token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
