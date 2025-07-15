import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { QlrController } from '../controllers/qlrController';

const qlrRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(QlrController);

  router.get('/', controller.getQlr);

  return router;
};

export const QLR_ROUTER_SYMBOL = Symbol('qlrRouterFactory');

export { qlrRouterFactory };
