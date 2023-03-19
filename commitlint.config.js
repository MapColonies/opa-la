const { utils: { getPackages } } = require('@commitlint/config-lerna-scopes');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': async ctx =>
      [2, 'always', [...(await getPackages(ctx)), "deps", "configurations"]],
      "scope-empty": [2, "never"],
  }
};
