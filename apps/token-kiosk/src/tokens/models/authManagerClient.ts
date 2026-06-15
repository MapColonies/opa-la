import type { Client } from 'openapi-fetch';
import createClient from 'openapi-fetch';
import type { DependencyContainer } from 'tsyringe';
import type { paths } from 'auth-openapi';
import type { ConfigType } from '@src/common/config';
import { SERVICES } from '@src/common/constants';

export type AuthManagerClient = Client<paths>;

export function authManagerClientFactory(container: DependencyContainer): AuthManagerClient {
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);

  const baseUrl = config.get('token.authManager.baseUrl');

  return createClient<paths>({
    baseUrl,
  });
}
