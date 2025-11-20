import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import loader from '@monaco-editor/loader';
import * as monaco from 'monaco-editor';

loader.config({ monaco });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
