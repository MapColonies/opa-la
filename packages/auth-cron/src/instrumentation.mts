// This file handles the configuration object initialization.
// You should be careful about editing this file, as it is a critical part of the application's functionality.
// Because this file is a module it should imported using the `--import` flag in the `node` command, and should not be imported by any other file.
import { tracingFactory } from './telemetry/tracing.js';
import { getConfig, initConfig } from './config.js';

await initConfig();

const config = getConfig();

const tracingConfig = config.get('telemetry.tracing');
const sharedConfig = config.get('telemetry.shared');

const tracing = tracingFactory({ ...tracingConfig, ...sharedConfig });

tracing.start();
