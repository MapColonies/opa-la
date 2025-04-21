import { JSONTree, type KeyPath } from 'react-json-tree';

const theme = {
  scheme: 'one-dark-pro',
  base00: '#1e1e1e', // background
  base01: '#2d2d2d',
  base02: '#3d3d3d',
  base03: '#5c6370', // comments
  base04: '#7f848e',
  base05: '#abb2bf', // default text
  base06: '#c5c8c6',
  base07: '#ffffff',
  base08: '#e06c75', // red
  base09: '#d19a66', // numbers
  base0A: '#e5c07b',
  base0B: '#98c379', // strings
  base0C: '#56b6c2',
  base0D: '#61afef', // blue
  base0E: '#c678dd', // purple
  base0F: '#be5046',
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface JsonTreeViewerProps {
  data: JsonValue;
  shouldExpandNodeInitially?: (keyPath: KeyPath, data: unknown, level: number) => boolean;
  className?: string;
}

export function JsonTreeViewer({ data, shouldExpandNodeInitially = () => true, className }: JsonTreeViewerProps) {
  return (
    <div className={`bg-[#1e1e1e] rounded-lg overflow-hidden p-4 font-mono text-sm ${className || ''}`}>
      <JSONTree data={data} theme={theme} invertTheme={false} shouldExpandNodeInitially={shouldExpandNodeInitially} />
    </div>
  );
}
