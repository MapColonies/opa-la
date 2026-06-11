import { describe, expect, it } from 'vitest';
import { computeRevision, extractNameAndVersion } from '@src/util';
import { Environment } from '../../auth-core/dist/entities';

describe('util.ts', function () {
  describe('#extractNameAndVersion', function () {
    it('should extract only the name and version from the object', function () {
      const input = [
        { name: 'avi', version: 1, x: 'd' },
        { name: 'iva', version: 1, x: 'd' },
      ];

      const res = extractNameAndVersion(input);

      expect(res).toStrictEqual([
        ['avi', 'iva'],
        [1, 1],
      ]);
    });
  });

  describe('#computeRevision', function () {
    const versions = {
      environment: Environment.NP,
      assets: [
        { name: 'b', version: 2 },
        { name: 'a', version: 1 },
      ],
      connections: [{ name: 'c', version: 1 }],
      keyVersion: 1,
    };

    it('should return a string prefixed with the environment followed by a 12-char hex hash', function () {
      expect(computeRevision(versions)).toMatch(/^np-[a-f0-9]{12}$/);
    });

    it('should be reproducible for the same versions', function () {
      expect(computeRevision(versions)).toBe(computeRevision(versions));
    });

    it('should produce different revisions for different content versions', function () {
      expect(computeRevision(versions)).not.toBe(computeRevision({ ...versions, keyVersion: 2 }));
    });

    it('should produce the same revision regardless of asset order', function () {
      const reordered = { ...versions, assets: [...versions.assets].reverse() };

      expect(computeRevision(versions)).toBe(computeRevision(reordered));
    });

    it('should produce the same revision regardless of connection order', function () {
      const moreConnections = {
        ...versions,
        connections: [
          { name: 'z', version: 1 },
          { name: 'a', version: 1 },
        ],
      };
      const reordered = { ...moreConnections, connections: [...moreConnections.connections].reverse() };

      expect(computeRevision(moreConnections)).toBe(computeRevision(reordered));
    });
  });
});
