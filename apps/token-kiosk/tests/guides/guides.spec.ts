import { describe, beforeEach, it, expect, beforeAll, afterEach, vi } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import type { RequestContext } from 'express-openid-connect';
import type { RequestHandler } from 'express';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import mockUser from '../data/user';

describe('guides', function () {
  let requestSender: RequestSender<paths, operations>;
  let oidcContext = { user: mockUser } as unknown as RequestContext;

  beforeAll(async function () {
    try {
      await initConfig(true);
    } catch (error) {
      console.error('Failed to initialize configuration:', error);
      throw error;
    }
  });

  beforeEach(async function () {
    const middlewareMock: RequestHandler = (req, res, next) => {
      req.oidc = oidcContext as unknown as RequestContext;
      next();
    };

    const [app] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: SERVICES.AUTH_MIDDLEWARE, provider: { useValue: middlewareMock } },
      ],
      useChild: true,
    });

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app, { baseUrl: '/api' });
  });

  afterEach(function () {
    oidcContext = { user: mockUser } as unknown as RequestContext;
    vi.resetAllMocks();
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the token', async function () {
      const res = await requestSender.getGuides();

      expect(res.status).toBe(httpStatusCodes.OK);
      expect(res).toSatisfyApiSpec();
      expect(res.body).toEqual({
        qgis: 'https://example.com/qgis-guide',
        arcgis: 'https://example.com/arcgis-guide',
        enabled: true,
      });
    });
  });
});
