import { Asset, Connection, Environment, Key } from '@map-colonies/auth-core';

/**
 * Interface for describing bundle versions
 */
export interface BundleContentVersions {
  /** Name and version pairs of the connections */
  connections: { version: number; name: string }[];
  /** Name and version pairs of the assets */
  assets: { version: number; name: string }[];
  /** Name and version pairs of the assets */
  keyVersion?: number;
  /** The environment of the versions   */
  environment: Environment;
}

/**
 * Interface for Bundle Content
 */
export interface BundleContent {
  /** The connections of the bundle */
  connections: Connection[];
  /** The assets of the bundle */
  assets: Asset[];
  /** The key of the bundle */
  key?: Key;
  /** The environment of the bundle  */
  environment: Environment;
}

/**
 * Options regarding tests while creating a bundle
 */
export interface TestOptions {
  /** Should test be ran in the creation process */
  enable: boolean;
  /** The coverage threshold for the tests. If undefined coverage won't be calculated */
  coverage?: number;
}
