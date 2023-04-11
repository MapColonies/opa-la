import HandleBars, { HelperOptions } from 'handlebars';

HandleBars.registerHelper('escapeJson', (value: string) => {
  return new HandleBars.SafeString(JSON.stringify(value));
});

HandleBars.registerHelper('delimitedEach', (context: unknown[], options: HelperOptions) => {
  let ret = '';

  for (let i = 0, j = context.length; i < j; i++) {
    if (i != 0) {
      ret += ',';
    }
    ret = ret + options.fn(context[i]);
  }

  return ret;
});

export function render(templateString: string, context: any) {
  const template = HandleBars.compile(templateString, { noEscape: true });
  return template(context, {});
}
