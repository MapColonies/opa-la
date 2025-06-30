import createClient from 'openapi-fetch';
import type { paths } from '@src/auth-manager';

export type AuthManagerClient = createClient.Client<paths>;

export function authManagerClientFactory(): AuthManagerClient {
  return createClient<paths>({
    baseUrl: 'https://auth-manager.example.com',
  });
}
