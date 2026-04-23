import { Router } from 'express';
import type { FactoryFunction } from 'tsyringe';
import { FileController } from '../controllers/filesController';

const filesRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(FileController);

  router.get('/:type', controller.getFile);

  return router;
};

export const FILES_ROUTER_SYMBOL = Symbol('filesRouterFactory');

export { filesRouterFactory };
