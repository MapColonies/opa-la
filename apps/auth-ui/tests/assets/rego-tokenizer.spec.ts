import { describe, expect, it } from 'vitest';
import * as monaco from 'monaco-editor';
import { REGO_LANGUAGE_ID, REGO_TEMPLATE_LANGUAGE_ID } from '@/lib/monaco/language-ids';
import { registerRego } from '@/lib/monaco/rego';

registerRego();

/** Token types per line, as the editor itself reports them. Monaco suffixes every type with the language id. */
const linesOf = (source: string): string[][] => monaco.editor.tokenize(source, REGO_LANGUAGE_ID).map((line) => line.map((token) => token.type));

/** Token types of a single-line sample, with the runs of whitespace between them dropped. */
const typesOf = (source: string): string[] =>
  linesOf(source)
    .flat()
    .filter((type) => type !== 'white.rego');

describe('rego language registration', () => {
  it('registers rego exactly once, however many times it is called', () => {
    expect(() => {
      registerRego();
      registerRego();
    }).not.toThrow();

    expect(monaco.languages.getLanguages().filter((language) => language.id === REGO_LANGUAGE_ID)).toHaveLength(1);
  });

  it('still tokenizes after the repeated calls', () => {
    expect(typesOf('allow := true')).toEqual(['identifier.rego', 'operator.rego', 'constant.language.rego']);
  });
});

describe('rego token classes', () => {
  it('reads keywords, including the current-generation ones', () => {
    const keywords = 'package import as default not with else some every in if contains print';

    expect(typesOf(keywords)).toEqual(new Array(keywords.split(' ').length).fill('keyword.rego'));
  });

  it('reads literals', () => {
    expect(typesOf('true false null')).toEqual(['constant.language.rego', 'constant.language.rego', 'constant.language.rego']);
  });

  it('reads built-in function names', () => {
    const builtins =
      'count sum max min sort_by concat sprintf startswith endswith indexof split trim_space lower upper to_number is_string is_number';

    expect(typesOf(builtins)).toEqual(new Array(builtins.split(' ').length).fill('predefined.rego'));
  });

  it('reads a namespaced built-in as a single token rather than around a dot operator', () => {
    expect(typesOf('object.get json.unmarshal time.now_ns io.jwt.decode rego.metadata.rule')).toEqual([
      'predefined.rego',
      'predefined.rego',
      'predefined.rego',
      'predefined.rego',
      'predefined.rego',
    ]);
  });

  it('splits a dotted path that is not a built-in', () => {
    expect(typesOf('data.users')).toEqual(['identifier.rego', 'operator.rego', 'identifier.rego']);
  });

  it('reads numbers', () => {
    expect(typesOf('0 42 2.5 1e3 6.02e23')).toEqual(['number.rego', 'number.rego', 'number.float.rego', 'number.rego', 'number.float.rego']);
  });

  it('reads a double-quoted string and its escapes', () => {
    expect(typesOf('"say \\"hi\\""')).toEqual([
      'string.quote.rego',
      'string.rego',
      'string.escape.rego',
      'string.rego',
      'string.escape.rego',
      'string.quote.rego',
    ]);
  });

  it('reads a backtick raw string, in which a backslash is not an escape', () => {
    expect(typesOf('`^\\d+$`')).toEqual(['string.quote.rego', 'string.rego', 'string.quote.rego']);
  });

  it('reads a hash line comment', () => {
    expect(typesOf('x := 1 # the answer')).toEqual(['identifier.rego', 'operator.rego', 'number.rego', 'comment.rego']);
  });

  it('reads operators', () => {
    const operators = ':= = == != < <= > >= + - * / % | & .';

    expect(typesOf(operators)).toEqual(new Array(operators.split(' ').length).fill('operator.rego'));
  });

  it('reads delimiters', () => {
    expect(typesOf('{ } [ ] ( ) , ; :')).toEqual([
      'delimiter.curly.rego',
      'delimiter.curly.rego',
      'delimiter.square.rego',
      'delimiter.square.rego',
      'delimiter.parenthesis.rego',
      'delimiter.parenthesis.rego',
      'delimiter.rego',
      'delimiter.rego',
      'delimiter.rego',
    ]);
  });
});

describe('rego current-generation syntax', () => {
  it('reads an `if` rule body', () => {
    expect(typesOf('allow if {')).toEqual(['identifier.rego', 'keyword.rego', 'delimiter.curly.rego']);
  });

  it('reads a `contains` partial-set rule', () => {
    expect(typesOf('deny contains msg if {')).toEqual(['identifier.rego', 'keyword.rego', 'identifier.rego', 'keyword.rego', 'delimiter.curly.rego']);
  });

  it('reads `some ... in`', () => {
    expect(typesOf('some user in data.users')).toEqual([
      'keyword.rego',
      'identifier.rego',
      'keyword.rego',
      'identifier.rego',
      'operator.rego',
      'identifier.rego',
    ]);
  });

  it('reads `every ... in`', () => {
    expect(typesOf('every domain in input.domains {')).toEqual([
      'keyword.rego',
      'identifier.rego',
      'keyword.rego',
      'identifier.rego',
      'operator.rego',
      'identifier.rego',
      'delimiter.curly.rego',
    ]);
  });

  it('carries tokenizer state across the lines of a whole module', () => {
    const module = [
      '# METADATA',
      '# title: HTTP Authorization Policy',
      'package http.authz',
      '',
      'import rego.v1',
      '',
      'default allow := false',
      '',
      'allow if {',
      '\tsome location in data.possibleLocations',
      '\tcount(location) == 2',
      '\tstartswith(input.path, "/api")',
      '}',
      '',
      'deny contains sprintf("bad host: %v", [host]) if {',
      '\tevery host in input.hosts {',
      '\t\tnot regex.match(`^[a-z.]+$`, host)',
      '\t}',
      '}',
    ].join('\n');

    const lines = linesOf(module);

    expect(lines).toHaveLength(19);
    expect(lines[0]).toEqual(['comment.rego']);
    expect(new Set(lines.flat())).toEqual(
      new Set([
        'comment.rego',
        'constant.language.rego',
        'delimiter.curly.rego',
        'delimiter.parenthesis.rego',
        'delimiter.rego',
        'delimiter.square.rego',
        'identifier.rego',
        'keyword.rego',
        'number.rego',
        'operator.rego',
        'predefined.rego',
        'string.quote.rego',
        'string.rego',
        'white.rego',
      ])
    );
  });
});

describe('rego template interpolations', () => {
  /** Token types of a single-line template sample, with the runs of whitespace dropped. */
  const templateTypesOf = (source: string): string[] =>
    monaco.editor
      .tokenize(source, REGO_TEMPLATE_LANGUAGE_ID)
      .flat()
      .map((token) => token.type)
      .filter((type) => type !== 'white.rego-template');

  it('reads an interpolation as one token rather than as brace delimiters', () => {
    expect(templateTypesOf('{{ escapeJson name }}')).toEqual(['variable.template.rego-template']);
  });

  it('reads block-helper and triple-stash interpolations', () => {
    expect(templateTypesOf('{{#delimitedEach domains}}')).toEqual(['variable.template.rego-template']);
    expect(templateTypesOf('{{/delimitedEach}}')).toEqual(['variable.template.rego-template']);
    expect(templateTypesOf('{{{ name }}}')).toEqual(['variable.template.rego-template']);
  });

  it('reads an interpolation embedded in a rego rule', () => {
    expect(templateTypesOf('valid_client := {{ escapeJson name }}')).toEqual([
      'identifier.rego-template',
      'operator.rego-template',
      'variable.template.rego-template',
    ]);
  });

  it('leaves braces as braces under plain rego, where an interpolation would be a syntax error anyway', () => {
    expect(typesOf('{{ escapeJson name }}')).not.toContain('variable.template.rego');
  });
});
