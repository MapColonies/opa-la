import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ConnectionController } from '../controllers/connectionController';

export const connectionRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ConnectionController);

  router.get('/', controller.getConnections);
  router.post('/', controller.upsertConnection);

  return router;
};

export const CONNECTION_ROUTER_SYMBOL = Symbol('connectionRouterFactory');
