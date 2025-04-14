import createClient from 'openapi-react-query';
import createFetchClient from 'openapi-fetch';
import type { paths } from '../types/schema';

const fetchClient = createFetchClient<paths>({
  baseUrl: 'http://localhost:8080/',
});

export const $api = createClient(fetchClient);
