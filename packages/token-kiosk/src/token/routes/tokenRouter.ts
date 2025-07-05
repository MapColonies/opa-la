import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { TokenController } from '../controllers/tokenController';

const tokenRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(TokenController);

  router.get('/', controller.getToken.bind(controller));

  return router;
};

export const TOKEN_ROUTER_SYMBOL = Symbol('tokenRouterFactory');

export { tokenRouterFactory };
