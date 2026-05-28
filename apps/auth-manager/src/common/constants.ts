import { readPackageJsonSync } from '@map-colonies/read-pkg';

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';

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
  DRIZZLE: Symbol('Drizzle'),
} satisfies Record<string, symbol>;
/* eslint-enable @typescript-eslint/naming-convention */
