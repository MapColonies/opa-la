export interface SiteConfig {
  url: string;
  envs: Array<{
    envKey: string;
    opalaUrl: string;
  }>;
  name: string;
}

export interface NetworkConfig {
  [siteName: string]: SiteConfig;
}
