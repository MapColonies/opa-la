import { type ReactNode } from 'react';
import { ApiClientContext, apiClient } from './ApiClientContext';

interface ApiClientProviderProps {
  children: ReactNode;
}

export function ApiClientProvider({ children }: ApiClientProviderProps) {
  return <ApiClientContext.Provider value={apiClient}>{children}</ApiClientContext.Provider>;
}
