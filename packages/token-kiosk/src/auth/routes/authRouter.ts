import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { AuthController } from '../controllers/authController';

const authRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(AuthController);

  router.get('/me', controller.getCurrentUser);

  return router;
};

export const AUTH_ROUTER_SYMBOL = Symbol('authRouterFactory');

export { authRouterFactory };
