import { Environments } from './common';

/**
 * Describes the metadata of contents of bundles that were created.
 */
export interface IBundle {
  /** The auto-generated ID of the bundle. */
  id?: number;
  /** The environment the bundle was created for. */
  environment: Environments;
  /** The md5 based hash of the bundle tarball. */
  hash?: string;
  /** Free form object to describe the bundle. */
  metadata?: Record<string, unknown>;
  /** A list of all the assets that are part of the bundle. */
  assets?: { name: string; version: number }[];
  /** A list of all the connections that are part of the bundle. */
  connections?: { name: string; version: number }[];
  /** Automatically generated date when the given bundle was created. */
  createdAt?: Date;
  /** The version of the key that is part of the bundle. */
  keyVersion?: number;
}
