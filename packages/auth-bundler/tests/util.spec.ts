import { extractNameAndVersion } from '../src/util';

describe('util.ts', function () {
  describe('#extractNameAndVersion', function () {
    it('extract only the name and version from the object', function () {
      const input = [
        { name: 'avi', version: 1, x: 'd' },
        { name: 'iva', version: 1, x: 'd' },
      ];

      const res = extractNameAndVersion(input);

      expect(res).toStrictEqual([
        { name: 'avi', version: 1 },
        { name: 'iva', version: 1 },
      ]);
    });
  });
});
