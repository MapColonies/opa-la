import { createContext } from 'react';
import { $api } from '../lib/httpClient';

// Create context for the API client using the existing client
export const ApiClientContext = createContext<typeof $api | null>(null);

// Export the existing client
export { $api as apiClient };
