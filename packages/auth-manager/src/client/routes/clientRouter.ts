import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ConnectionController } from '@connection/controllers/connectionController';
import { ClientController } from '../controllers/clientController';

export const clientRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ClientController);
  const connectionController = dependencyContainer.resolve(ConnectionController);

  router.get('/', controller.getClients);
  router.post('/', controller.createClient);
  router.get('/:clientName', controller.getClient);
  router.patch('/:clientName', controller.updateClient);
  router.get('/:clientName/connection', connectionController.getNamedConnections);
  router.get('/:clientName/connection/:environment', connectionController.getNamedEnvConnections);
  router.get('/:clientName/connection/:environment/:version', connectionController.getConnection);

  return router;
};

export const CLIENT_ROUTER_SYMBOL = Symbol('clientRouterFactory');
