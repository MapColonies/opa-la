import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { GuidesController } from '../controllers/guidesController';

const guidesRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(GuidesController);

  router.get('/', controller.getGuides);

  return router;
};

export const GUIDES_ROUTER_SYMBOL = Symbol('guidesRouterFactory');

export { guidesRouterFactory };
