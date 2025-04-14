import * as path from 'path';
//@ts-ignore
import tailwindcss from '@tailwindcss/vite';
//@ts-ignore
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
