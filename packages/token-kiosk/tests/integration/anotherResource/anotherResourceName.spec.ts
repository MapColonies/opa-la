import { describe, beforeEach, it, expect, beforeAll } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@src/common/constants';
import { initConfig } from '@src/common/config';

describe('anotherResourceName', function () {
  let requestSender: RequestSender<paths, operations>;

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    const [app] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });
    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getAnotherResource();

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response).toSatisfyApiSpec();

      const resource = response.body;
      expect(resource.kind).toBe('avi');
      expect(resource.isAlive).toBe(false);
    });
  });
  // describe('Bad Path', function () {
  //   // All requests with status code of 400
  // });
  // describe('Sad Path', function () {
  //   // All requests with status code 4XX-5XX
  // });
});
