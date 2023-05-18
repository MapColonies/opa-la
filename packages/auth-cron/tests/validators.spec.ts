import { AppConfig } from '../src/config';
import { validateConfigSchema } from '../src/validators';

describe('validators.ts', function () {
  describe('#validateConfigSchema', function () {
    it('should not throw if the schema is valid', function () {
      const schema: AppConfig = {
        cron: {},
        db: {
          database: 'avi',
          enableSslAuth: false,
          host: 'avi',
          password: 'avi',
          port: 5432,
          schema: 'avi',
          username: 'avi',
        },
        telemetry: {
          logger: { level: 'debug', prettyPrint: false },
        },
      };

      validateConfigSchema(schema);

      // expect(validateConfigSchema(schema)).not.toThrow();
    });
  });
});
