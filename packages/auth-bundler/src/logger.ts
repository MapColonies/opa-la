import { Logger } from '@map-colonies/js-logger';

/**
 * The optional logger instance for any logging required in this package
 * @defaultValue undefined
 * @ignore
 */
export let logger: Logger | undefined;

/**
 * A function to set the logger for the entire package.
 * @param externalLogger The instance of pino to set as the logger
 * @group logger
 * @see {@link https://github.com/MapColonies/js-logger }
 * @see {@link https://github.com/pinojs/pino }
 */
export function setLogger(externalLogger: Logger): void {
  // consider creating child logger?
  logger = externalLogger;
}

/**
 * A function to disable the logger in the package.
 * @group logger
 * @see {@link https://github.com/MapColonies/js-logger }
 * @see {@link https://github.com/pinojs/pino }
 */
export function unsetLogger(): void {
  logger = undefined;
}
