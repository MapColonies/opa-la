module.exports = {
  extends: ['@map-colonies/commitlint-config', '@commitlint/config-pnpm-scopes'],
  rules: {
    'scope-empty': [2, 'never'],
  },
};
