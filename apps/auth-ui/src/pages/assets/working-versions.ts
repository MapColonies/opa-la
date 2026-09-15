import type { components } from 'auth-openapi';
import { ENVIRONMENTS } from './draft';

type Asset = components['schemas']['asset'];
type Environment = components['schemas']['environment'];

/**
 * Which asset version each environment is built from, computed the same way the bundler
 * computes it: the highest version whose targeted environments include that one.
 *
 * This is not the same as "latest". An asset whose newest version targets prod only
 * leaves an older version as the one prod's and np's bundles disagree about — np keeps
 * building from the older one, which is live even though it is not the latest.
 */
const workingVersions = (versions: Asset[]): Map<Environment, number> => {
  const working = new Map<Environment, number>();

  for (const environment of ENVIRONMENTS) {
    const targeting = versions.filter((version) => version.environment.includes(environment));
    if (targeting.length === 0) continue;
    working.set(environment, Math.max(...targeting.map((version) => version.version)));
  }

  return working;
};

/** The environments whose bundle is built from this asset version, in a stable order. */
export const environmentsInUseBy = (version: number, versions: Asset[]): Environment[] => {
  const working = workingVersions(versions);
  return ENVIRONMENTS.filter((environment) => working.get(environment) === version);
};
