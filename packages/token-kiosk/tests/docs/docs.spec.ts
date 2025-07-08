import { describe, beforeEach, it, expect, beforeAll } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import type { RequestHandler } from 'express';
import type { RequestContext } from 'express-openid-connect';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { getApp } from '@src/app';
import { SERVICES } from '@src/common/constants';
import { initConfig } from '@src/common/config';
import { DocsRequestSender } from './helpers/docsRequestSender';

describe('docs', function () {
  let requestSender: DocsRequestSender;

  beforeAll(async function () {
    await initConfig(true);
  });

  const middlewareMock: RequestHandler = (req, res, next) => {
    req.oidc = { user: {} } as unknown as RequestContext;
    next();
  };

  beforeEach(async function () {
    const [app] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: SERVICES.AUTH_MIDDLEWARE, provider: { useValue: middlewareMock } },
      ],
      useChild: true,
    });
    requestSender = new DocsRequestSender(app);
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getDocs();

      console.log(response.body);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.type).toBe('text/html');
    });

    it('should return 200 status code and the json spec', async function () {
      const response = await requestSender.getDocsJson();

      expect(response.status).toBe(httpStatusCodes.OK);

      expect(response.type).toBe('application/json');
      expect(response.body).toHaveProperty('openapi');
    });
  });
});
