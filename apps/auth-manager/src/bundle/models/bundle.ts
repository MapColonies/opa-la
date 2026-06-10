import type { Bundle } from '@map-colonies/auth-core';

export interface BundleSearchParams {
  environment?: Bundle['environment'][];
  createdBefore?: Bundle['createdAt'];
  createdAfter?: Bundle['createdAt'];
}
