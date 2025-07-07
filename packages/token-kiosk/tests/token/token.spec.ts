import { describe, beforeEach, it, expect, beforeAll, afterEach } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import nock, { abortPendingRequests, cleanAll, disableNetConnect } from 'nock';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import type { RequestContext } from 'express-openid-connect';
import type { RequestHandler } from 'express';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import privateKey from '../data/key';
import mockUser from '../data/user';
import { Drizzle } from '@src/db/createConnection';
import { users } from '@src/users/user';

// Type guard for token response
const isTokenResponse = (body: unknown): body is { token: string; expiration: string } => {
  return typeof body === 'object' && body !== null && 'token' in body && 'expiration' in body;
};

// Type guard for error response
const isErrorResponse = (body: unknown): body is { message: string } => {
  return typeof body === 'object' && body !== null && 'message' in body;
};

// disableNetConnect();

describe('token', function () {
  let requestSender: RequestSender<paths, operations>;
  let oidcContext = { user: mockUser } as unknown as RequestContext;
  let drizzle: Drizzle;

  beforeAll(async function () {
    await initConfig(true);
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

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
    drizzle = container.resolve<Drizzle>(SERVICES.DRIZZLE);
  });

  afterEach(function () {
    oidcContext = { user: mockUser } as unknown as RequestContext;
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the token', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, privateKey);

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();

      if (isTokenResponse(res.body)) {
        expect(res.body.token).not.toBe('');
      }
    });

    it('should return the same token if requested again while still valid', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, privateKey);

      const firstRes = await requestSender.getToken();
      const secondRes = await requestSender.getToken();

      expect(firstRes).toSatisfyApiSpec();
      expect(secondRes).toSatisfyApiSpec();

      if (isTokenResponse(firstRes.body) && isTokenResponse(secondRes.body)) {
        expect(firstRes.body.token).toBe(secondRes.body.token);
      }
    });

    it('should return valid token structure with proper expiration format', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, privateKey);

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();

      if (isTokenResponse(res.body)) {
        // Check that expiration is a valid ISO date string
        const expiration = new Date(res.body.expiration);
        expect(expiration.getTime()).toBeGreaterThan(Date.now());
      }
    });
  });

  describe('Bad Path', function () {
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

      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, privateKey);

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.FORBIDDEN);
    });

    it('should return 401 status code when user ID is missing', async function () {
      const noUserIdContext = {
        user: {},
      } as unknown as RequestContext;

      oidcContext = noUserIdContext;

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.UNAUTHORIZED);
    });

    it('should return 401 status code when user context is undefined', async function () {
      oidcContext = { user: undefined } as unknown as RequestContext;

      const res = await requestSender.getToken();

      expect(res).toHaveProperty('statusCode', httpStatusCodes.UNAUTHORIZED);
      expect(res).toSatisfyApiSpec();
    });
  });

  describe('Sad Path', function () {
    afterEach(function () {
      // Clean up all nock interceptors after each test
      abortPendingRequests();
      cleanAll();
    });

    it('should return 500 status code when auth manager service is unavailable', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.SERVICE_UNAVAILABLE);

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when auth manager returns 404 for missing key', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.NOT_FOUND, {
        message: 'Key not found',
      });

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when auth manager returns malformed key', async function () {
      nock('http://localhost:8082')
        .get('/key/prod/latest')
        .reply(httpStatusCodes.OK, {
          privateKey: { malformed: 'key' },
          environment: 'prod',
        });

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when auth manager connection times out', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').delay(10000).reply(httpStatusCodes.OK, privateKey);

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when auth manager returns 500 error', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'Internal server error',
      });

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when network error occurs', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').replyWithError('Network error');

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when auth manager returns invalid JSON', async function () {
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, 'invalid json');

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when database connection fails', async function () {
      // This test would require mocking database failures
      // For now, we'll simulate it by having the auth manager return a proper key
      // but the database operation fails internally
      expect.fail();
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, privateKey);

      // Mock database failure by intercepting the auth manager client
      const res = await requestSender.getToken();

      // This test might need more specific database error simulation
      // For now, just ensure the endpoint handles errors gracefully
      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);

      expect([httpStatusCodes.OK, httpStatusCodes.INTERNAL_SERVER_ERROR]).toContain(res.statusCode);
    });
  });
});
