import { describe, beforeEach, it, expect, beforeAll } from 'vitest';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';

describe('resourceName', function () {
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
      const response = await requestSender.getResourceName();

      expect(response.status).toBe(httpStatusCodes.OK);

      const resource = response.body;
      expect(response).toSatisfyApiSpec();
      expect(resource.id).toBe(1);
      expect(resource.name).toBe('ronin');
      expect(resource.description).toBe('can you do a logistics run?');
    });
    it('should return 200 status code and create the resource', async function () {
      const response = await requestSender.createResource({
        requestBody: {
          description: 'aaa',
          id: 1,
          name: 'aaa',
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.CREATED);
    });
  });
  // describe('Bad Path', function () {
  //   // All requests with status code of 400
  // });
  // describe('Sad Path', function () {
  //   // All requests with status code 4XX-5XX
  // });
});
