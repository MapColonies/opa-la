import { Environments } from '@map-colonies/auth-core';

export interface ConnectionSearchParams {
  search?: string;
  latestOnly?: boolean;
  environment?: Environments[];
  isEnabled?: boolean;
  isNoBrowser?: boolean;
  isNoOrigin?: boolean;
  domains?: string[];
  name?: string;
}
