import type AdminJS from 'adminjs';
import type { ResourceOptions } from 'adminjs';
import { getAdmin } from './wrappers/adminjs';
import { init } from './wrappers/adminjsExpress';
import { getAdminSql } from './wrappers/adminjsSql';

export async function initUi(): Promise<AdminJS> {
  await init();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Adapter, Database, Resource } = await getAdminSql();
  const adminImport = await getAdmin();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  adminImport.AdminJS.registerAdapter({ Database: Database, Resource: Resource });

  const db = await new Adapter('postgresql', {
    connectionString: 'postgres://postgres:postgres@localhost:5432/auth-manager',
    database: 'auth-manager',
  }).init();

  // console.log(typeof AdminJS);
  const resourceOptions: ResourceOptions = {
    actions: {
      delete: {
        isAccessible: false,
      },
      bulkDelete: {
        isAccessible: false,
      },
      new: {
        custom: {
          avi: '123',
        },
        handler: async (request, response, context) => {
          console.log(context.resource.properties());
        },
      },
    },
    properties: {
      name: {
        isRequired: true,
      },
      tags: {
        isArray: true,
      },
      created_at: {
        isVisible: {
          edit: false,
        },
      },
    },
  };

  const admin = new adminImport.AdminJS({
    resources: [
      {
        resource: db.table('client'),
        options: resourceOptions,
      },
    ],
    // databases: [db]
  });

  await admin.watch();
  console.log(admin.options.rootPath);

  return admin;
}
