export interface SiteConfig {
  url: string;
  envs: Array<{
    envKey: string;
    opaUrl: string;
  }>;
  name: string;
}

export interface NetworkConfig {
  [siteName: string]: SiteConfig;
}
