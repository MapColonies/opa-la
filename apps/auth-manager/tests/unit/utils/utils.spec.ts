import { describe, expect, it } from 'vitest';
import { asteriskStringComparatorLast } from '@src/utils/utils';

describe('asteriskStringComparatorLast', () => {
  const comparator = asteriskStringComparatorLast();

  describe('Happy Path', () => {
    it('should return 1 when a has asterisk and b does not', () => {
      expect(comparator('foo*', 'bar')).toBe(1);
    });

    it('should return -1 when a does not have asterisk and b does', () => {
      expect(comparator('foo', 'bar*')).toBe(-1);
    });

    it('should return 0 when both have asterisk', () => {
      expect(comparator('foo*', 'bar*')).toBe(0);
    });

    it('should return 0 when neither have asterisk', () => {
      expect(comparator('foo', 'bar')).toBe(0);
    });

    it('should sort array with asterisk strings last', () => {
      const arr = ['foo*', 'bar', 'baz*', 'qux'];
      const sorted = arr.sort(comparator);

      expect(sorted).toEqual(['bar', 'qux', 'foo*', 'baz*']);
    });
  });
});
