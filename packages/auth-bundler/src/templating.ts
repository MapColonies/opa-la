import HandleBars, { HelperOptions } from 'handlebars';
import { logger } from './logger';

HandleBars.registerHelper('escapeJson', (value: string) => {
  return new HandleBars.SafeString(JSON.stringify(value));
});

HandleBars.registerHelper('delimitedEach', (context: unknown[], options: HelperOptions) => {
  return context.map((v) => options.fn(v)).join(',');
});

/**
 * Template the provided string with the given context using HandleBarsJS
 * @param templateString The string to run the template engine on
 * @param context The context passed to to the template function
 * @see {@link https://handlebarsjs.com/}
 * @returns The templated string
 * @ignore
 */
export function render(templateString: string, context: unknown): string {
  logger?.debug({ msg: 'rendering template', template: templateString, context });
  const template = HandleBars.compile(templateString, { noEscape: true, strict: true });
  return template(context, {});
}
