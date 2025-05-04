/** The possible authentication deployment environments. */
export const Environment = {
  /** Non production, may also be called dev. */
  NP: 'np',
  /** The staging environment, may also be called integration. */
  STAGE: 'stage',
  /** The production environment. */
  PRODUCTION: 'prod',
} as const;

export type Environments = (typeof Environment)[keyof typeof Environment];
