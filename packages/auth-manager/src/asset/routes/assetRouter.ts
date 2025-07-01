import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { AssetController } from '../controllers/assetController';

export const assetRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(AssetController);

  router.get('/', controller.getAssets);
  router.post('/', controller.upsertAsset);
  router.get('/:assetName', controller.getNamedAssets);
  router.get('/:assetName/latest', controller.getLatestAsset);
  router.get('/:assetName/:version', controller.getAsset);

  return router;
};

export const ASSET_ROUTER_SYMBOL = Symbol('assetRouterFactory');
