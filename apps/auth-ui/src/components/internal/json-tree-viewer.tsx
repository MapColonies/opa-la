import { JSONTree, type KeyPath } from 'react-json-tree';
import { useState } from 'react';

const darkTheme = {
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

const lightTheme = {
  scheme: 'github',
  base00: 'transparent', // background
  base01: '#f5f5f5',
  base02: '#e8e8e8',
  base03: '#999999', // comments
  base04: '#666666',
  base05: '#333333', // default text
  base06: '#222222',
  base07: '#1a1a1a',
  base08: '#d73a49', // red
  base09: '#005cc5', // numbers
  base0A: '#e36209',
  base0B: '#22863a', // strings
  base0C: '#032f62',
  base0D: '#6f42c1', // blue
  base0E: '#6f42c1', // purple
  base0F: '#24292e',
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface JsonTreeViewerProps {
  data: JsonValue;
  shouldExpandNodeInitially?: (keyPath: KeyPath, data: unknown, level: number) => boolean;
  className?: string;
  initialTheme?: 'light' | 'dark';
  showThemeToggle?: boolean;
}

export function JsonTreeViewer({
  data,
  shouldExpandNodeInitially = () => true,
  className,
  initialTheme = 'dark',
  showThemeToggle = false,
}: JsonTreeViewerProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;
  const bgColor = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f8f9fa]';
  const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const buttonBgColor = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400';

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`${bgColor} rounded-lg overflow-hidden p-4 font-mono text-sm ${className || ''}`}>
      {showThemeToggle && (
        <div className="flex justify-start mb-2">
          <button
            onClick={toggleTheme}
            className={`${buttonBgColor} ${textColor} px-3 py-1 rounded-md text-xs transition-colors duration-200 flex items-center gap-2`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Light Mode
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                Dark Mode
              </>
            )}
          </button>
        </div>
      )}
      <JSONTree data={data} theme={selectedTheme} invertTheme={false} shouldExpandNodeInitially={shouldExpandNodeInitially} />
    </div>
  );
}
