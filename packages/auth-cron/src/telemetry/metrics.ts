import { Registry } from 'prom-client';
import { collectMetricsExpressMiddleware } from '@map-colonies/telemetry/prom-metrics';
import { getConfig } from '../config';

const metricsRegistry = new Registry();

collectMetricsExpressMiddleware({ registry: metricsRegistry });
getConfig().initializeMetrics(metricsRegistry);

export { metricsRegistry };
