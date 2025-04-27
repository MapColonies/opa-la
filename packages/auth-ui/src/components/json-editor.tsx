import { Editor } from '@monaco-editor/react';
import { useCallback, useState } from 'react';

interface JSONEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function JSONEditor({ value, onChange, minHeight = '60px' }: JSONEditorProps) {
  const [editorHeight, setEditorHeight] = useState(minHeight);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onChange(value || '');
    },
    [onChange]
  );

  const handleEditorDidMount = useCallback(
    (editor: any) => {
      editor.onDidContentSizeChange(() => {
        const contentHeight = Math.max(editor.getContentHeight(), parseInt(minHeight, 10));
        setEditorHeight(`${contentHeight}px`);
      });

      const contentHeight = Math.max(editor.getContentHeight(), parseInt(minHeight, 10));
      setEditorHeight(`${contentHeight}px`);
    },
    [minHeight]
  );

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <Editor
        height={editorHeight}
        defaultLanguage="json"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          fixedOverflowWidgets: true,
          renderLineHighlight: 'none',
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
            useShadows: false,
            verticalScrollbarSize: 0,
            horizontalScrollbarSize: 0,
          },
        }}
      />
    </div>
  );
}
