import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ConnectionController } from '../controllers/connectionController';

export const nestedConnectionRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ConnectionController);

  router.get('/', controller.getNamedConnections);
  router.get('/:environment', controller.getNamedEnvConnections);
  router.get('/:environment/:version', controller.getConnection);

  return router;
};

export const connectionRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ConnectionController);

  router.get('/', controller.getConnections);
  router.post('/', controller.upsertConnection);

  return router;
};

export const NESTED_CONNECTION_ROUTER_SYMBOL = Symbol('nestedConnectionRouterFactory');
export const CONNECTION_ROUTER_SYMBOL = Symbol('connectionRouterFactory');
