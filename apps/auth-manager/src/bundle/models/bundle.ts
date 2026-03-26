import { IBundle } from '@map-colonies/auth-core';

export interface BundleSearchParams {
  environment?: IBundle['environment'][];
  createdBefore?: IBundle['createdAt'];
  createdAfter?: IBundle['createdAt'];
}
