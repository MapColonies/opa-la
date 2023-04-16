import { IClient } from '@map-colonies/auth-core';

export interface ClientSearchParams {
  branch: IClient['branch'];
  createdBefore: IClient['createdAt'];
  createdAfter: IClient['createdAt'];
  updatedBefore: IClient['createdAt'];
  updatedAfter: IClient['createdAt'];
  tags: IClient['tags'];
}
