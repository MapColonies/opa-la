import { Adapter, Database, Resource } from '@adminjs/sql/lib';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function getAdminSql(): Promise<{ Database: typeof Database, Resource: typeof Resource, Adapter: typeof Adapter }>;
