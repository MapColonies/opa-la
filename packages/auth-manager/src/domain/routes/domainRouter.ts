import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { DomainController } from '../controllers/domainController';

const domainRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(DomainController);

  router.get('/', controller.getDomains);
  router.post('/', controller.createDomain);

  return router;
};

export const DOMAIN_ROUTER_SYMBOL = Symbol('domainRouterFactory');

export { domainRouterFactory };
