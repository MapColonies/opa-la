import { render } from '../src/templating';

describe('templating.ts', function () {
  describe('#render', function () {
    it('should template the given string', function () {
      const template = '{{name}}';

      const res = render(template, { name: 'avi' });

      expect(res).toBe('avi');
    });

    it('should escape any given string', function () {
      const template = '{{escapeJson name}}';

      const res = render(template, { name: 'avi' });

      expect(res).toBe('"avi"');
    });

    it('should loop over the context and put , between values', function () {
      const template = '{{#delimitedEach .}}{{name}}{{/delimitedEach}}';

      const res = render(template, [{ name: 'avi' }, { name: 'iva' }]);

      expect(res).toBe('avi,iva');
    });
  });
});
