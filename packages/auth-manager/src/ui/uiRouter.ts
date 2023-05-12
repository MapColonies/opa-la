import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import type AdminJS from 'adminjs';
import { getRouter } from './wrappers/adminjsExpress';

const uiRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const admin = dependencyContainer.resolve<AdminJS>('AdminJS');
  const router = getRouter().buildRouter(admin);
  // const controller = dependencyContainer.resolve(DomainController);

  return router;
};

export const UI_ROUTER_SYMBOL = Symbol('uiRouterFactory');

export { uiRouterFactory };
