import { astrickStringComparatorLast } from '@src/utils/utils';

describe('astrickStringComparatorLast', () => {
  const comparator = astrickStringComparatorLast();

  describe('Happy Path', () => {
    it('returns 1 when a has asterisk and b does not', () => {
      expect(comparator('foo*', 'bar')).toBe(1);
    });

    it('returns -1 when a does not have asterisk and b does', () => {
      expect(comparator('foo', 'bar*')).toBe(-1);
    });

    it('returns 0 when both have asterisk', () => {
      expect(comparator('foo*', 'bar*')).toBe(0);
    });

    it('returns 0 when neither have asterisk', () => {
      expect(comparator('foo', 'bar')).toBe(0);
    });

    it('sorts array with asterisk strings last', () => {
      const arr = ['foo*', 'bar', 'baz*', 'qux'];
      const sorted = arr.sort(comparator);
      expect(sorted).toEqual(['bar', 'qux', 'foo*', 'baz*']);
    });
  });
});
