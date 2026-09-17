import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import loader from '@monaco-editor/loader';
import * as monaco from 'monaco-editor';
import { registerRego } from './lib/monaco/rego';

loader.config({ monaco });
registerRego();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
