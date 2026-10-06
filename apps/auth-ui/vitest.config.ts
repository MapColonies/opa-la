import * as path from 'path';
//@ts-ignore
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Dependency source maps the published packages do not ship are not worth the noise.
  logLevel: 'error',
  resolve: {
    alias: [
      { find: /^@\//, replacement: path.resolve(__dirname, './src') + '/' },
      // The editor cannot run under jsdom. See tests/mocks/monaco-editor-react.tsx.
      { find: /^@monaco-editor\/react$/, replacement: path.resolve(__dirname, './tests/mocks/monaco-editor-react.tsx') },
      // monaco-editor declares only a `module` entry, which the runner's node-side
      // resolution does not read. Point at it directly.
      { find: /^monaco-editor$/, replacement: 'monaco-editor/esm/vs/editor/editor.main.js' },
    ],
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost:3000/' } },
    setupFiles: ['./tests/setup.ts'],
    // Scoped to the assets and bundles features. The rest of the application has no tests yet.
    include: ['tests/assets/**/*.spec.{ts,tsx}', 'tests/bundles/**/*.spec.{ts,tsx}'],
  },
});
