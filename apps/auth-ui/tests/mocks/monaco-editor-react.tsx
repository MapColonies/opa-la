/**
 * Stand-in for `@monaco-editor/react`, aliased in by the vitest config.
 *
 * The editor cannot run under jsdom — it needs real layout and canvas measurement —
 * so component tests get a text area that forwards content and changes, and a diff
 * component that renders both sides. Consequence: highlighting and diff rendering
 * are not covered by component tests.
 */
import { useEffect, useRef, useState } from 'react';

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

/** The real library's values, so a test can name the keybinding that was registered. */
const CTRL_CMD = 2048;
const KEY_S = 49;

const fakeMonaco = { KeyMod: { CtrlCmd: CTRL_CMD }, KeyCode: { KeyS: KEY_S } };

export const SAVE_KEYBINDING = CTRL_CMD | KEY_S;

export const Editor = ({ value, defaultValue, language, defaultLanguage, theme, height, options, onChange, onMount }: EditorProps) => {
  const mounted = useRef(false);
  const [commands, setCommands] = useState<number[]>([]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    onMount?.(
      {
        onDidContentSizeChange: () => ({ dispose: () => {} }),
        getContentHeight: () => 200,
        addCommand: (keybinding: number) => setCommands((current) => [...current, keybinding]),
        focus: () => {},
        layout: () => {},
      },
      fakeMonaco
    );
  }, [onMount]);

  return (
    <textarea
      data-testid="monaco-editor"
      aria-label="Editor"
      data-language={language ?? defaultLanguage}
      data-theme={theme}
      data-height={height}
      data-commands={commands.join(',')}
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
