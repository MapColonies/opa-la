import { Database, Resource } from '@adminjs/sql/lib';
import AdminJSClass from 'adminjs';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function getAdmin(): Promise<{ AdminJS: typeof AdminJSClass & { registerAdapter: typeof AdminJSClass.registerAdapter } }>;
