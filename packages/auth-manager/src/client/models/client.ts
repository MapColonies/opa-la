import { IClient } from '@map-colonies/auth-core';

export interface ClientSearchParams {
  search?: IClient['name'];
  branch?: IClient['branch'];
  createdBefore?: IClient['createdAt'];
  createdAfter?: IClient['createdAt'];
  updatedBefore?: IClient['createdAt'];
  updatedAfter?: IClient['createdAt'];
  tags?: IClient['tags'];
}
