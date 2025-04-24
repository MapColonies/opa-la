import { Environments } from './common';

/**
 * All the different types of possible assets.
 */
// export enum AssetType {
//   /** OPA test files. */
//   TEST = 'TEST',
//   TEST_DATA = 'TEST_DATA',
//   /** OPA policy files. */
//   POLICY = 'POLICY',
//   /** OPA data files, name should end with .json or .yaml. */
//   DATA = 'DATA',
// }

export const AssetType = {
  /** OPA test files. */
  TEST: 'TEST',
  TEST_DATA: 'TEST_DATA',
  /** OPA policy files. */
  POLICY: 'POLICY',
  /** OPA data files, name should end with .json or .yaml. */
  DATA: 'DATA',
} as const;

export type AssetTypes = (typeof AssetType)[keyof typeof AssetType];

/**
 * Describes the metadata and content of assets - files that will be part of the bundle.
 */
export interface IAsset {
  /** The unique name of the asset. */
  name: string;
  /**
   * The version of Asset with the given name. Starts at 1 and automatically increments.
   * When updated, the POST body should contain the latest version.
   */
  version: number;
  /** Automatically generated date when the given asset version was created. */
  createdAt?: Date;
  /** Base64 encoded value of the asset file. */
  value: string;
  /** The path inside the bundle the asset will be in. use / for the root of the bundle. */
  uri: string;
  /** The asset type. */
  type: AssetTypes;
  /** The environments the asset belongs do. It will be deployed only to the specified environments. */
  environment: Environments[];
  /** Whether the file contains a template that should be rendered before inserting to the bundle. */
  isTemplate: boolean;
}
