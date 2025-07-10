import { readPackageJsonSync } from '@map-colonies/read-pkg';

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';
export const DEFAULT_SERVER_PORT = 80;

export const DB_CONNECTION_TIMEOUT = 5000;

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  METRICS: Symbol('METRICS'),
  AUTH_MANAGER_CLIENT: Symbol('AuthManagerClient'),
  AUTH_MIDDLEWARE: Symbol('AuthMiddleware'),
  PG_POOL: Symbol('PgPool'),
  DRIZZLE: Symbol('Drizzle'),
  HEALTHCHECK: Symbol('HealthCheck'),
} satisfies Record<string, symbol>;
/* eslint-enable @typescript-eslint/naming-convention */
