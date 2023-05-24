import { Environment } from '@map-colonies/auth-core';
import { AppConfig } from '../src/config';
import { validateConfigSchema, validateS3 } from '../src/validators';

describe('validators.ts', function () {
  describe('#validateConfigSchema', function () {
    it('should not throw if the schema is valid', function () {
      const schema: AppConfig = {
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
        cron: {
          np: {
            pattern: '*/10 * * * * *',
            s3: {
              accessKey: 'minioadmin',
              secretKey: 'minioadmin',
              bucket: 'bundles',
              key: 'np.tar.gz',
              endpoint: 'http://localhost:9000',
            },
          },
        },
      };

      expect(() => validateConfigSchema(schema)).not.toThrow();
    });

    it('should throw if the cron section is empty', function () {
      const schema: AppConfig = {
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
        cron: {},
      };

      expect(() => validateConfigSchema(schema)).toThrow();
    });

    it('should throw if enable ssl auth is enabled but no ssl config is specified', function () {
      const schema: AppConfig = {
        db: {
          database: 'avi',
          enableSslAuth: true,
          host: 'avi',
          password: 'avi',
          port: 5432,
          schema: 'avi',
          username: 'avi',
        },
        telemetry: {
          logger: { level: 'debug', prettyPrint: false },
        },
        cron: {
          np: {
            pattern: '*/10 * * * * *',
            s3: {
              accessKey: 'minioadmin',
              secretKey: 'minioadmin',
              bucket: 'bundles',
              key: 'np.tar.gz',
              endpoint: 'http://localhost:9000',
            },
          },
        },
      };

      expect(() => validateConfigSchema(schema)).toThrow();
    });
  });

  describe('#validateS3', function () {
    it('should not throw if the bucket exists', async function () {
      const promise = validateS3([Environment.NP]);

      await expect(promise).resolves.not.toThrow();
    });

    it('should throw if the bucket does not exists', async function () {
      const promise = validateS3([Environment.PRODUCTION]);

      await expect(promise).rejects.toThrow();
    });
  });
});
