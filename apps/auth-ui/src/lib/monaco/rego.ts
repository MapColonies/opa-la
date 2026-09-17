import * as monaco from 'monaco-editor';
import { REGO_LANGUAGE_ID, REGO_TEMPLATE_LANGUAGE_ID } from './language-ids';

const configuration: monaco.languages.LanguageConfiguration = {
  comments: { lineComment: '#' },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string', 'comment'] },
    { open: '`', close: '`', notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: '`', close: '`' },
  ],
};

/**
 * Handlebars interpolations, which auth-bundler substitutes into template assets.
 * Prepended to the root rules, ahead of the operator and delimiter ones, or `{{` is
 * read as two braces.
 */
const interpolationRule: monaco.languages.IMonarchLanguageRule = [/\{\{\{?[^{}]*\}?\}\}/, 'variable.template'];

const language: monaco.languages.IMonarchLanguage = {
  keywords: ['package', 'import', 'as', 'default', 'not', 'with', 'else', 'some', 'every', 'in', 'if', 'contains', 'print'],

  literals: ['true', 'false', 'null'],

  // A representative slice of the built-in catalogue rather than all of it; a name missing
  // here degrades to a plain identifier, which is why this list needs no maintenance.
  builtins: [
    'all',
    'any',
    'concat',
    'count',
    'endswith',
    'format_int',
    'indexof',
    'is_array',
    'is_boolean',
    'is_null',
    'is_number',
    'is_object',
    'is_set',
    'is_string',
    'lower',
    'max',
    'min',
    'product',
    'replace',
    'sort',
    'sort_by',
    'split',
    'sprintf',
    'startswith',
    'substring',
    'sum',
    'to_number',
    'trace',
    'trim',
    'trim_space',
    'type_name',
    'upper',
    'walk',
    'base64.decode',
    'base64.encode',
    'base64url.encode_no_pad',
    'crypto.sha256',
    'glob.match',
    'io.jwt.decode',
    'io.jwt.decode_verify',
    'io.jwt.verify_rs256',
    'json.filter',
    'json.marshal',
    'json.patch',
    'json.unmarshal',
    'net.cidr_contains',
    'numbers.range',
    'object.get',
    'object.keys',
    'object.remove',
    'object.union',
    'opa.runtime',
    'regex.find_n',
    'regex.match',
    'rego.metadata.rule',
    'time.date',
    'time.now_ns',
    'time.parse_rfc3339_ns',
    'units.parse_bytes',
    'yaml.marshal',
    'yaml.unmarshal',
  ],

  operators: [':=', '=', '==', '!=', '<', '<=', '>', '>=', '+', '-', '*', '/', '%', '|', '&', '.'],

  symbols: /[=!<>+\-*/%|&.:]+/,

  tokenizer: {
    root: [
      { include: '@whitespace' },

      [/\d+\.\d+(?:[eE][-+]?\d+)?/, 'number.float'],
      [/\d+(?:[eE][-+]?\d+)?/, 'number'],

      // Namespaced built-ins are one token, so `time.now_ns` does not split around a `.`
      // operator. Any other dotted path is re-read one segment at a time.
      [/[a-z_][\w$]*(?:\.[a-z_][\w$]*)+/, { cases: { '@builtins': 'predefined', '@default': { token: '@rematch', next: '@qualifiedName' } } }],
      [
        /[a-zA-Z_$][\w$]*/,
        { cases: { '@keywords': 'keyword', '@literals': 'constant.language', '@builtins': 'predefined', '@default': 'identifier' } },
      ],

      [/"/, { token: 'string.quote', bracket: '@open', next: '@doubleQuotedString' }],
      [/`/, { token: 'string.quote', bracket: '@open', next: '@rawString' }],

      [/[{}()[\]]/, '@brackets'],
      [/[,;]/, 'delimiter'],
      [/@symbols/, { cases: { '@operators': 'operator', '@default': 'delimiter' } }],
    ],

    // Reached only by a rematch, so it always consumes the leading segment before popping.
    qualifiedName: [[/[a-zA-Z_$][\w$]*/, { token: 'identifier', next: '@pop' }]],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/#.*$/, 'comment'],
    ],

    doubleQuotedString: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],

    rawString: [
      [/[^`]+/, 'string'],
      [/`/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],
  },
};

/** The template variant differs only by the interpolation rule, so the two cannot drift apart. */
const withInterpolations = (base: monaco.languages.IMonarchLanguage): monaco.languages.IMonarchLanguage => ({
  ...base,
  tokenizer: { ...base.tokenizer, root: [interpolationRule, ...(base.tokenizer['root'] as monaco.languages.IMonarchLanguageRule[])] },
});

let registered = false;

/**
 * Teach the editor to highlight Rego, plain and with template interpolations.
 * Highlighting only — no parsing, validation or diagnostics; syntax errors surface
 * downstream when the bundle is built.
 *
 * Safe to call repeatedly: hot reload and strict mode's double invocation would
 * otherwise raise a duplicate-language error.
 */
export function registerRego(): void {
  if (registered || monaco.languages.getLanguages().some((candidate) => candidate.id === REGO_LANGUAGE_ID)) {
    registered = true;
    return;
  }

  registered = true;

  monaco.languages.register({ id: REGO_LANGUAGE_ID, extensions: ['.rego'], aliases: ['Rego', 'rego'], mimetypes: ['text/x-rego'] });
  monaco.languages.setLanguageConfiguration(REGO_LANGUAGE_ID, configuration);
  monaco.languages.setMonarchTokensProvider(REGO_LANGUAGE_ID, language);

  monaco.languages.register({ id: REGO_TEMPLATE_LANGUAGE_ID, aliases: ['Rego template'] });
  monaco.languages.setLanguageConfiguration(REGO_TEMPLATE_LANGUAGE_ID, configuration);
  monaco.languages.setMonarchTokensProvider(REGO_TEMPLATE_LANGUAGE_ID, withInterpolations(language));
}
