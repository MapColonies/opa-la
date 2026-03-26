import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { BundleController } from '../controllers/bundleController';

const bundleRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(BundleController);

  router.get('/', controller.getBundles);
  router.get('/:id', controller.getBundle);

  return router;
};

export const BUNDLE_ROUTER_SYMBOL = Symbol('bundleRouterFactory');

export { bundleRouterFactory };
