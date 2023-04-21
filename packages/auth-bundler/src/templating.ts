import HandleBars, { HelperOptions } from 'handlebars';

HandleBars.registerHelper('escapeJson', (value: string) => {
  return new HandleBars.SafeString(JSON.stringify(value));
});

HandleBars.registerHelper('delimitedEach', (context: unknown[], options: HelperOptions) => {
  return context.map((v) => options.fn(v)).join(',');
});

export function render(templateString: string, context: unknown): string {
  const template = HandleBars.compile(templateString, { noEscape: true, strict: true });
  return template(context, {});
}
