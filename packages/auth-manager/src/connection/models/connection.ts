import { Environments } from '@map-colonies/auth-core';

export interface ConnectionSearchParams {
  environment?: Environments[];
  isEnabled?: boolean;
  isNoBrowser?: boolean;
  isNoOrigin?: boolean;
  domains?: string[];
  name?: string;
}
