import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { KeyController } from '../controllers/keyController';

export const keyRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(KeyController);

  router.get('/', controller.getLatestKeys);
  router.post('/', controller.upsertKey);
  router.get('/:environment', controller.getKeys);
  router.get('/:environment/:version', controller.getKey);

  return router;
};

export const KEY_ROUTER_SYMBOL = Symbol('keyRouterFactory');
