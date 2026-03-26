import { readPackageJsonSync } from '@map-colonies/read-pkg';

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';
export const DEFAULT_SERVER_PORT = 80;

export const DB_CONNECTION_TIMEOUT = 5000;

export const TOKENS_ISSUER = 'mapcolonies-token-cli';

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  METRICS: Symbol('Metrics'),
  HEALTHCHECK: Symbol('Healthcheck'),
  DOMAIN_REPOSITORY: Symbol('DOMAIN_REPO'),
  CLIENT_REPOSITORY: Symbol('CLIENT_REPO'),
  KEY_REPOSITORY: Symbol('KEY_REPO'),
  ASSET_REPOSITORY: Symbol('ASSET_REPO'),
  CONNECTION_REPOSITORY: Symbol('CONNECTION_REPO'),
  BUNDLE_REPOSITORY: Symbol('BUNDLE_REPO'),
} satisfies Record<string, symbol>;
/* eslint-enable @typescript-eslint/naming-convention */
