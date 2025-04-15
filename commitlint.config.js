const { utils: { getPackages } } = require('@commitlint/config-lerna-scopes');

module.exports = {
  extends: ['@map-colonies/commitlint-config'],
  rules: {
    'scope-enum': async ctx =>
      [2, 'always', [...(await getPackages(ctx))]],
  }
};
