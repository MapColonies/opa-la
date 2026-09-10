/**
 * Stand-in for `@monaco-editor/react`, aliased in by the vitest config.
 *
 * The editor cannot run under jsdom — it needs real layout and canvas measurement —
 * so component tests get a text area that forwards content and changes, and a diff
 * component that renders both sides. Consequence: highlighting and diff rendering
 * are not covered by component tests.
 */
import { useEffect, useRef } from 'react';

interface EditorProps {
  value?: string;
  defaultValue?: string;
  defaultLanguage?: string;
  language?: string;
  height?: string | number;
  theme?: string;
  options?: { readOnly?: boolean } & Record<string, unknown>;
  onChange?: (value: string | undefined) => void;
  onMount?: (editor: unknown, monaco: unknown) => void;
}

interface DiffEditorProps {
  original?: string;
  modified?: string;
  language?: string;
  theme?: string;
  height?: string | number;
  options?: Record<string, unknown>;
}

const fakeEditor = {
  onDidContentSizeChange: () => ({ dispose: () => {} }),
  getContentHeight: () => 200,
  addCommand: () => {},
  focus: () => {},
  layout: () => {},
};

export const Editor = ({ value, defaultValue, language, defaultLanguage, theme, options, onChange, onMount }: EditorProps) => {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    onMount?.(fakeEditor, {});
  }, [onMount]);

  return (
    <textarea
      data-testid="monaco-editor"
      aria-label="Editor"
      data-language={language ?? defaultLanguage}
      data-theme={theme}
      readOnly={options?.readOnly === true}
      value={value ?? defaultValue ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
};

export const DiffEditor = ({ original, modified, language, theme }: DiffEditorProps) => (
  <div data-testid="monaco-diff-editor" data-language={language} data-theme={theme}>
    <pre data-testid="diff-original">{original}</pre>
    <pre data-testid="diff-modified">{modified}</pre>
  </div>
);

export const useMonaco = () => null;

export const loader = {
  config: () => {},
  init: () => Promise.resolve({}),
};
