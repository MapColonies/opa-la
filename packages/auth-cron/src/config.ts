import { DbConfig } from '@map-colonies/auth-core';
import { JSONSchemaType } from 'ajv';

interface TelemetryConfig {
  logger: { level: 'debug' | 'info' | 'warn' | 'error'; prettyPrint: boolean };
}


const cronSchema: JSONSchemaType<CronConfig> = {
  type: 'object',
  properties: {
    enabled: {
      type: 'boolean',
    },
    pattern: {
      type: 'string',
    },
    s3: {
      type: 'object',
      properties: {
        accessKey: {
          type: 'string',
        },
        secretKey: {
          type: 'string',
        },
        endpoint: {
          type: 'string',
        },
        bucket: {
          type: 'string',
        },
        key: {
          type: 'string',
        },
      },
      required: ['accessKey', 'secretKey', 'bucket', 'key', 'endpoint'],
    },
  },
  required: ['pattern'],
};

export interface CronConfig {
  s3: S3Config;
  enabled: boolean;
  pattern: string;
}

export interface S3Config {
  accessKey: string;
  secretKey: string;
  endpoint: string;
  bucket: string;
  key: string;
}

export interface AppConfig {
  telemetry: TelemetryConfig;
  db: Required<Pick<DbConfig, 'host' | 'port' | 'username' | 'password' | 'enableSslAuth' | 'database' | 'schema'>> &
    Partial<Pick<DbConfig, 'sslPaths'>>;
  cron: {
    np?: CronConfig;
    stage?: CronConfig;
    prod?: CronConfig;
  };
}

export const configSchema: JSONSchemaType<AppConfig> = {
  type: 'object',
  required: ['cron', 'telemetry'],
  properties: {
    db: {
      required: ['database', 'enableSslAuth', 'host', 'password', 'port', 'schema', 'username'],
      type: 'object',
      properties: {
        database: {
          type: 'string',
        },
        host: {
          type: 'string',
        },
        username: { type: 'string' },
        password: { type: 'string' },
        port: { type: 'integer' },
        schema: { type: 'string' },
        enableSslAuth: { type: 'boolean' },
        sslPaths: {
          nullable: true,
          type: 'object',
          required: ['ca', 'cert', 'key'],
          properties: {
            ca: {
              type: 'string',
            },
            cert: {
              type: 'string',
            },
            key: {
              type: 'string',
            },
          },
        },
      },
      if: {
        properties: {
          enableSslAuth: true,
        },
      },
      then: {
        properties: { sslPaths: { nullable: false } },
        required: ['database', 'enableSslAuth', 'host', 'password', 'port', 'schema', 'username', 'sslPaths'],
      },
    },
    telemetry: {
      type: 'object',
      required: ['logger'],
      properties: {
        logger: {
          type: 'object',
          required: ['level', 'prettyPrint'],
          properties: {
            level: {
              type: 'string',
              enum: ['debug', 'error', 'info', 'warn'],
            },
            prettyPrint: {
              type: 'boolean',
            },
          },
        },
      },
    },
    cron: {
      type: 'object',
      additionalProperties: false,
      anyOf: [{ required: ['np'] }, { required: ['stage'] }, { required: ['prod'] }],
      properties: {
        np: { ...cronSchema, nullable: true },
        prod: { ...cronSchema, nullable: true },
        stage: { ...cronSchema, nullable: true },
      },
    },
  },
};
