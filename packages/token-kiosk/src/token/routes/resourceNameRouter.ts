import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { TokenController } from '../controllers/tokenController';

const resourceNameRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(TokenController);

  router.get('/', controller.getResource);
  router.post('/', controller.createResource);

  return router;
};

export const RESOURCE_NAME_ROUTER_SYMBOL = Symbol('resourceNameRouterFactory');

export { resourceNameRouterFactory };
