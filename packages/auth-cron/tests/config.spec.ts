import { getConfig } from '../src/config';

describe('config.ts', function () {
  describe('#getConfig', function () {
    it('should throw if the config is not initialized', function () {
      expect(() => getConfig()).toThrow();
    });
  });
});
