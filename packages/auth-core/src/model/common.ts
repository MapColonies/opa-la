/** The possible authentication deployment environments. */
/* eslint-disable @typescript-eslint/naming-convention */
export const Environment = {
  /** Non production, may also be called dev. */
  NP: 'np',
  /** The staging environment, may also be called integration. */
  STAGE: 'stage',
  /** The production environment. */
  PRODUCTION: 'prod',
} as const;
/* eslint-enable @typescript-eslint/naming-convention */

export type Environments = (typeof Environment)[keyof typeof Environment];
