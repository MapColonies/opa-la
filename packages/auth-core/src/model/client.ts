export interface PointOfContact {
  name: string;
  phone: string;
  email: string;
}

export interface IClient {
  name: string;
  hebName: string;
  description?: string;
  branch?: string;
  createdAt?: Date;
  updatedAt?: Date;
  techPointOfContact?: PointOfContact;
  productPointOfContact?: PointOfContact;
  tags?: string[];
}
