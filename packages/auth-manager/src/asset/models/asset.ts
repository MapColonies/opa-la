import { AssetType, Environment } from 'auth-core';

export interface AssetSearchParams {
  type?: AssetType;
  environment?: Environment[];
  isTemplate?: boolean;
}
