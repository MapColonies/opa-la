import { describe, expect, it } from 'vitest';
import * as monaco from 'monaco-editor';

// The tokenizer tests need the real editor library, stylesheet imports and all.
// This proves the transform pipeline loads it outside a browser, and that a
// tokenizer registered from this repository is readable back through its api.
describe('monaco-editor under the test runner', () => {
  it('tokenizes a language registered at runtime', () => {
    monaco.languages.register({ id: 'harness-probe' });
    monaco.languages.setMonarchTokensProvider('harness-probe', {
      tokenizer: {
        root: [
          [/#.*$/, 'comment'],
          [/\w+/, 'identifier'],
        ],
      },
    });

    const [line] = monaco.editor.tokenize('alpha # note', 'harness-probe');

    expect(line?.map((token) => token.type)).toEqual(['identifier.harness-probe', 'source.harness-probe', 'comment.harness-probe']);
  });
});
