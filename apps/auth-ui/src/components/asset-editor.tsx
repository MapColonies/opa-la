import { DiffEditor, Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useRef } from 'react';
import { REGO_LANGUAGE_ID, REGO_TEMPLATE_LANGUAGE_ID } from '../lib/monaco/language-ids';

/**
 * The asset editor. Unlike the json editor the opa validator uses, this one is a fixed
 * height filling its container with its own scrollbar, so a page's save action stays on
 * screen however long the policy is.
 *
 * The existing json editor is deliberately left alone: the validator page depends on it.
 */
interface AssetEditorProps {
  value: string;
  language: string;
  /** A template asset's interpolation points are highlighted apart from the rego around them. */
  isTemplate?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  /** Fires on the editor's save shortcut, which also swallows the browser default. */
  onSave?: () => void;
}

interface AssetDiffEditorProps {
  original: string;
  modified: string;
  language: string;
  isTemplate?: boolean;
}

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
  fixedOverflowWidgets: true,
} as const;

/** The editor follows the application theme by prop, so a theme change does not remount it. */
const useEditorTheme = (): string => (useTheme().resolvedTheme === 'dark' ? 'vs-dark' : 'light');

const templateVariant = (language: string, isTemplate: boolean): string =>
  isTemplate && language === REGO_LANGUAGE_ID ? REGO_TEMPLATE_LANGUAGE_ID : language;

export const AssetEditor = ({ value, language, isTemplate = false, readOnly = false, onChange, onSave }: AssetEditorProps) => {
  const theme = useEditorTheme();

  // The command is registered once, on mount, so it has to read the current handler.
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  return (
    <div
      className="h-full overflow-hidden rounded-md border"
      // Belt and braces. The command below is the one the editor itself dispatches; this
      // catches the keystroke if it ever reaches the wrapper instead, and either way the
      // browser's own save dialog is what must not open.
      onKeyDown={(event) => {
        if (!onSave || event.key !== 's' || !(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        onSave();
      }}
    >
      <Editor
        height="100%"
        language={templateVariant(language, isTemplate)}
        theme={theme}
        value={value}
        onChange={(next) => onChange?.(next ?? '')}
        options={{ ...EDITOR_OPTIONS, readOnly }}
        onMount={(editor, monaco) => {
          if (monaco.KeyMod === undefined || monaco.KeyCode === undefined) return;
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSaveRef.current?.());
        }}
      />
    </div>
  );
};

export const AssetDiffEditor = ({ original, modified, language, isTemplate = false }: AssetDiffEditorProps) => {
  const theme = useEditorTheme();

  return (
    <div className="h-full overflow-hidden rounded-md border">
      <DiffEditor
        height="100%"
        language={templateVariant(language, isTemplate)}
        theme={theme}
        original={original}
        modified={modified}
        options={{ ...EDITOR_OPTIONS, readOnly: true }}
      />
    </div>
  );
};
