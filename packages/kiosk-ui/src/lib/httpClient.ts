import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';
import type { paths } from '../types/openapi';

// Create a global handler for 401 responses
let redirectToWelcome: (() => void) | null = null;

export function setAuthRedirectHandler(handler: () => void) {
  redirectToWelcome = handler;
}

const fetchClient = createFetchClient<paths>({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle 401s globally
fetchClient.use({
  onResponse({ response }) {
    if (response.status === 401 && redirectToWelcome) {
      // Small delay to prevent race conditions
      setTimeout(() => {
        redirectToWelcome?.();
      }, 100);
    }
  },
});

export const $api = createClient(fetchClient);
