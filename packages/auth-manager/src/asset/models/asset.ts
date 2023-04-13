import { AssetType, Environment } from '@map-colonies/auth-core';

export interface AssetSearchParams {
  type?: AssetType;
  environment?: Environment[];
  isTemplate?: boolean;
}
