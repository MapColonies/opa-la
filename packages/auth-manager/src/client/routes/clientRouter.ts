import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ClientController } from '../controllers/clientController';

export const clientRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ClientController);

  router.get('/', controller.getClients);
  router.post('/', controller.createClient);
  router.get('/:clientName', controller.getClient);
  router.patch('/:clientName', controller.updateClient);

  return router;
};

export const CLIENT_ROUTER_SYMBOL = Symbol('clientRouterFactory');
