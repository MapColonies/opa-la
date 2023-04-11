import { Environment } from 'auth-core';

export interface ConnectionSearchParams {
  environment?: Environment[];
  isEnabled?: boolean;
  isNoBrowser?: boolean;
  isNoOrigin?: boolean;
  domains?: string[];
  name?: string;
}
