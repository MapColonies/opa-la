import { Asset, Connection, Environment, Key } from "@map-colonies/auth-core";

export interface BundleContentVersions {
  connections: { version: number; name: string }[];
  assets: { version: number; name: string }[];
  key: number;
  environment: Environment
}

export interface BundleContent {
  connections: Connection[]
  assets: Asset[]
  key?: Key,
  environment: Environment
}
