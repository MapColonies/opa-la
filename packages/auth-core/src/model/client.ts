/**
 * Describes The contact information of a specific person.
 */
export interface PointOfContact {
  /** The full name. */
  name: string;
  phone: string;
  email: string;
}

/**
 * Describes a specific authentication client. e.g. a system not a person.
 */
export interface IClient {
  /** The name of the client. */
  name: string;
  /** The name of the client in hebrew. */
  hebName: string;
  /** A short description about the client. */
  description?: string;
  /** The branch the client belongs to. */
  branch?: string;
  /** Automatically generated date of when the given client was created at. */
  createdAt?: Date;
  /** Automatically generated date of when the given client was updated at. */
  updatedAt?: Date;
  /** The contact details of the person in charge of tech at the client. */
  techPointOfContact?: PointOfContact;
  /** The contact details of the person in charge of product at the client. */
  productPointOfContact?: PointOfContact;
  /** The tags describing the client. */
  tags?: string[];
}
