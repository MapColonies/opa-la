import { Tracing } from '@map-colonies/telemetry';
import { IGNORED_INCOMING_TRACE_ROUTES, IGNORED_OUTGOING_TRACE_ROUTES } from './constants';

export const tracing = new Tracing(
  [],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  { '@opentelemetry/instrumentation-http': { ignoreIncomingPaths: IGNORED_INCOMING_TRACE_ROUTES, ignoreOutgoingUrls: IGNORED_OUTGOING_TRACE_ROUTES } }
);
