import { setTimeout as sleep } from 'timers/promises';
import { describe, beforeEach, it, expect, beforeAll, afterEach, vi } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import nock, { abortPendingRequests, cleanAll } from 'nock';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import type { RequestContext } from 'express-openid-connect';
import type { RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { subWeeks } from 'date-fns';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { Drizzle } from '@src/db/createConnection';
import { users } from '@src/users/user';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import privateKey from '../data/key';
import mockUser from '../data/user';

// Type guard for token response
const isTokenResponse = (body: unknown): body is { token: string; expiration: string } => {
  return typeof body === 'object' && body !== null && 'token' in body && 'expiration' in body;
};

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
    vi.resetAllMocks();
    // Clean up all nock interceptors after each test
    abortPendingRequests();
    cleanAll();
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
      const newUserContext = {
        user: {
          ...mockUser,
          email: 'two_requests@gmail.com',
        },
      } as unknown as RequestContext;
      oidcContext = newUserContext;
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

    it('should return a new token after expiration', async function () {
      const email = 'expired@gmail.com';
      const newUserContext = {
        user: {
          ...mockUser,
          email,
        },
      } as unknown as RequestContext;
      oidcContext = newUserContext;
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, privateKey);
      const firstRes = await requestSender.getToken();

      expect(firstRes).toHaveProperty('statusCode', httpStatusCodes.OK);
      await drizzle
        .update(users)
        .set({
          tokenExpirationDate: subWeeks(new Date(), 5), // Set expiration to the past
        })
        .where(eq(users.id, email))
        .execute();

      await sleep(1000); // Wait for a short period to ensure the token is considered expired

      const secondRes = await requestSender.getToken();
      expect(secondRes).toHaveProperty('statusCode', httpStatusCodes.OK);

      if (isTokenResponse(firstRes.body) && isTokenResponse(secondRes.body)) {
        expect(secondRes.body.token).not.toEqual(firstRes.body.token); // Ensure a new token is generated
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
    it('should return 500 status code when auth manager service is unavailable', async function () {
      const newUserContext = {
        user: {
          ...mockUser,
          email: 'unavailable@gmail.com',
        },
      } as unknown as RequestContext;

      oidcContext = newUserContext;
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.SERVICE_UNAVAILABLE);

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when auth manager returns 404 for missing key', async function () {
      const newUserContext = {
        user: {
          ...mockUser,
          email: 'missing-key@gmail.com',
        },
      } as unknown as RequestContext;

      oidcContext = newUserContext;
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.NOT_FOUND, {
        message: 'Key not found',
      });

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when auth manager returns malformed key', async function () {
      const newUserContext = {
        user: {
          ...mockUser,
          email: 'malformed-key@gmail.com',
        },
      } as unknown as RequestContext;
      oidcContext = newUserContext;
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

    it('should return 500 status code when auth manager returns 500 error', async function () {
      const newUserContext = {
        user: {
          ...mockUser,
          email: '500error@gmail.com',
        },
      } as unknown as RequestContext;
      oidcContext = newUserContext;
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'Internal server error',
      });

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when network error occurs', async function () {
      const newUserContext = {
        user: {
          ...mockUser,
          email: 'network-error@gmail.com',
        },
      } as unknown as RequestContext;
      oidcContext = newUserContext;
      nock('http://localhost:8082').get('/key/prod/latest').replyWithError('Network error');

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when auth manager returns invalid JSON', async function () {
      const newUserContext = {
        user: {
          ...mockUser,
          email: 'invalid-json@gmail.com',
        },
      } as unknown as RequestContext;
      oidcContext = newUserContext;
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, 'invalid json');

      const res = await requestSender.getToken();

      expect(res).toSatisfyApiSpec();
      expect(res).toHaveProperty('statusCode', httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 status code when database connection fails', async function () {
      const newUserContext = {
        user: {
          ...mockUser,
          email: 'db-fail@gmail.com',
        },
      } as unknown as RequestContext;
      oidcContext = newUserContext;
      nock('http://localhost:8082').get('/key/prod/latest').reply(httpStatusCodes.OK, privateKey);
      vi.spyOn(drizzle.query.users, 'findFirst').mockRejectedValue(new Error('Database connection failed'));

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
