export interface SiteConfig {
  url: string;
  envs: Array<'prod' | 'np' | 'stage'>;
  name: string;
}

export interface NetworkConfig {
  [siteName: string]: SiteConfig;
}
