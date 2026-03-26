import { Registry } from 'prom-client';
import { getConfig } from '../config';

const metricsRegistry = new Registry();
getConfig().initializeMetrics(metricsRegistry);

export { metricsRegistry };
