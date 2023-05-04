import { render } from '../dist/templating.js';

const context = [{ name: 'avi', enabled: true }, { name: 'iva' }];

const template = `
[
  {{#delimitedEach .}}
  {
    "name": {{ name }}
  }
  {{/delimitedEach}}
  ]
`;

console.log(render(template, context));
