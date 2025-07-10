import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';
import type { paths } from '../types/openapi';

// Create a global handler for 401 responses
let authRedirectHandler: (() => void) | null = null;

export function setAuthRedirectHandler(handler: () => void) {
  authRedirectHandler = handler;
}

const fetchClient = createFetchClient<paths>({
  baseUrl: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle 401s globally
fetchClient.use({
  onResponse({ response }) {
    if (response.status === 401 && authRedirectHandler) {
      // Small delay to prevent race conditions
      setTimeout(() => {
        authRedirectHandler?.();
      }, 100);
    }
  },
});

export const $api = createClient(fetchClient);
