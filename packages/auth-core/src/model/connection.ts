import { Environment } from './common';

/**
 * A connection is the object describing the details of
 * how a specific clients authenticates to a specific {@link Environment}.
 */
export interface IConnection {
  /** The name of the clients this connection relates to. */
  name: string;
  /**
   * The version of the connection with the given {@link name} and {@link environment}. Starts at 1 and automatically increments.
   * When updated, the POST body should contain the latest version.
   */
  version: number;
  /** The environment this connection relates to. */
  environment: Environment;
  /** Automatically generated date of when the given connection version was created at. */
  createdAt?: Date;
  /** Is the connection enabled. If it is not, it wwill be ignored when creating a new bundle. */
  enabled: boolean;
  /** The client's token for the specific environment. The KID parameter in the token should equal the client's name. */
  token: string;
  /** Decides if requests that are not originated from a browser are allowed. */
  allowNoBrowserConnection: boolean;
  /** Decides if requests that are missing the Origin header are allowed. */
  allowNoOriginConnection: boolean;
  /** A list of domains that the client is allowed to send request to. */
  domains: string[];
  /** A list of origins the client is allowed to send requests from. */
  origins: string[];
}
