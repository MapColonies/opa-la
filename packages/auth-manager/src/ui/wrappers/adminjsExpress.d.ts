import * as AdminJSExpress from '@adminjs/express';
import AdminJS from 'adminjs';
import { Router } from 'express';

export function init(): Promise<void>;

export function getRouter(): {
  buildRouter: (admin: AdminJS, predefinedRouter?: Router | null, formidableOptions?: AdminJSExpress.FormidableOptions) => Router;
};
