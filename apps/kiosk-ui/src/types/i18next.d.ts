import resources from './resource';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof resources;
  }
}
