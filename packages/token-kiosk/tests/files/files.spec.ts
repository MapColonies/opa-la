import { describe, beforeEach, it, expect, beforeAll, afterEach, vi } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import nock, { abortPendingRequests, cleanAll } from 'nock';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import type { RequestContext } from 'express-openid-connect';
import type { RequestHandler } from 'express';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { Drizzle } from '@src/db/createConnection';
import { users } from '@src/users/user';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import privateKey from '../data/key';
import mockUser from '../data/user';
import { emptyResponse, goodResponse, partialResponse } from './cswResponses';

describe('guides', function () {
  let requestSender: RequestSender<paths, operations>;
  let oidcContext = { user: mockUser } as unknown as RequestContext;
  let drizzle: Drizzle;

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

    const [app, container] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: SERVICES.AUTH_MIDDLEWARE, provider: { useValue: middlewareMock } },
      ],
      useChild: true,
    });

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app, { baseUrl: '/api' });
    drizzle = container.resolve<Drizzle>(SERVICES.DRIZZLE);
    nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, privateKey);
  });

  afterEach(function () {
    oidcContext = { user: mockUser } as unknown as RequestContext;
    vi.resetAllMocks();
    // Clean up all nock interceptors after each test
    abortPendingRequests();
    cleanAll();
  });

  describe('Happy Path', function () {
    it('should return 200 status code a qlr file', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.OK, goodResponse);

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res.status).toBe(httpStatusCodes.OK);
      expect(res).toSatisfyApiSpec();
      expect(res.headers['content-disposition']).toMatch(/attachment; filename="mapcolonies-layers-\d{4}-\d{2}-\d{2}\.qlr"/);
      expect(res.headers['content-type']).toBe('application/xml; charset=utf-8');
      expect(res.text).toMatchSnapshot('qlr-file-content');
    });

    it.skip('should return 200 status code a lyrx file', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.OK, goodResponse);

      const res = await requestSender.getFile({ pathParams: { type: 'lyrx' } });

      expect(res.status).toBe(httpStatusCodes.OK);
      expect(res).toSatisfyApiSpec();
      expect(res.headers['content-disposition']).toMatch(/attachment; filename="mapcolonies-layers-\d{4}-\d{2}-\d{2}\.lyrx"/);
      expect(res.headers['content-type']).toBe('application/json');
      expect(res.body).toMatchSnapshot('lyrx-file-content');
    });
  });

  describe('Bad Path', function () {
    it('should return 401 status code when user is not authenticated', async function () {
      // Mock user as undefined to simulate unauthenticated request
      const unauthenticatedContext = { user: undefined } as unknown as RequestContext;
      oidcContext = unauthenticatedContext;

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.UNAUTHORIZED);
    });

    it('should return 403 status code when user is banned', async function () {
      await drizzle.insert(users).values({ id: 'xd@gmail.com', token: '', isBanned: true, tokenExpirationDate: new Date() }).onConflictDoNothing();

      // Mock user as banned by setting up the context to simulate a banned user
      const bannedUserContext = {
        user: {
          ...mockUser,
          email: 'xd@gmail.com',
        },
      } as unknown as RequestContext;

      oidcContext = bannedUserContext;

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.FORBIDDEN);
    });
  });

  describe('Sad Path', function () {
    it('should return 500 status code when the catalog service is unavailable', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.SERVICE_UNAVAILABLE);

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when catalog service returns 404', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.NOT_FOUND);

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code if the catalog service returns 500', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.INTERNAL_SERVER_ERROR);

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when network error occurs', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').replyWithError('Network error');

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 if the server returns an empty response', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.OK, '');

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when the catalog service returns invalid XML', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.OK, '<invalidXml>');

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });
      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when catalog service response is missing some fields', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.OK, partialResponse);

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 if the catalog service returns a catalog response with no entries', async function () {
      nock('http://localhost:8085').post('/api/raster/v1').reply(httpStatusCodes.OK, emptyResponse);

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });
      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when database connection fails', async function () {
      vi.spyOn(drizzle.query.users, 'findFirst').mockRejectedValue(new Error('Database connection failed'));

      const res = await requestSender.getFile({ pathParams: { type: 'qlr' } });

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});
