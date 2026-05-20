/// <reference types="jest-extended" />
import { beforeAll, describe, expect, it, afterEach, vi } from 'vitest';
import httpStatusCodes from 'http-status-codes';
import type { DependencyContainer } from 'tsyringe';
import { faker } from '@faker-js/faker';
import 'jest-openapi';
import type { Drizzle } from '@map-colonies/auth-core';
import { clientTable } from '@map-colonies/auth-core';
import type { ExpectResponseStatus, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { expectResponseStatusFactory } from '@map-colonies/openapi-helpers/requestSender';
import { getFakeClient } from 'test-utils';
import type { paths, operations } from 'auth-openapi';
import { initEnvironment } from '../setup.js';

type ApiClient = paths['/client']['post']['requestBody']['content']['application/json'];

const expectResponseStatus: ExpectResponseStatus = expectResponseStatusFactory(expect);

describe('client', function () {
  let requestSender: RequestSender<paths, operations>;
  let drizzle: Drizzle;

  beforeAll(async function () {
    const env = await initEnvironment();
    requestSender = env.requestSender;
    drizzle = env.drizzle;
  });

  describe('Happy Path', function () {
    describe('GET /client', function () {
      afterEach(async function () {
        await drizzle.delete(clientTable);
      });

      it('should return 200 status code and a list of clients', async function () {
        const clients = [getFakeClient(false), getFakeClient(false)];

        // const connection = depContainer.resolve(DataSource);
        await drizzle.insert(clientTable).values(clients).execute();

        const res = await requestSender.getClients();

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toIncludeAllPartialMembers(clients);
      });

      it.each([
        { name: 'avi', searchParam: 'avi', matchType: 'exact' },
        { name: 'bobavi', searchParam: 'avi', matchType: 'suffix' },
        { name: 'aviiiiii', searchParam: 'av', matchType: 'prefix' },
        { name: 'blaviabla', searchParam: 'avi', matchType: 'middle' },
        { name: 'avi', searchParam: 'AV', matchType: 'case-insensitive' },
      ])('should find the user $name with search string $searchParam with match type $matchType', async function ({ name, searchParam }) {
        const client = { ...getFakeClient(false), name };
        await drizzle.insert(clientTable).values(client).execute();

        const res = await requestSender.getClients({
          queryParams: {
            name: searchParam,
          },
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        console.log(res.body);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect((res.body as Exclude<typeof res.body, { message: string }>).items).toSatisfyAny((item) => item.name === name);
      });

      it('should return empty array when no clients match the name search param', async function () {
        const client = { ...getFakeClient(false), name: 'bla' };
        await drizzle.insert(clientTable).values(client);

        const res = await requestSender.getClients({
          queryParams: {
            name: 'avi',
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(0);
      });

      it('should support filtering by dates', async function () {
        const clients = [
          { ...getFakeClient(false), createdAt: new Date('2022-12-01') },
          { ...getFakeClient(false), createdAt: new Date('2023-01-01') },
          { ...getFakeClient(false), createdAt: new Date('2023-02-01') },
        ];
        await drizzle.insert(clientTable).values(clients);

        const res = await requestSender.getClients({
          queryParams: {
            createdAfter: new Date('2022-12-31').toISOString(),
            createdBefore: new Date('2023-03-31').toISOString(),
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(2);
      });

      it('should support basic pagination with page and pageSize', async function () {
        const TOTAL_CLIENTS = 5;
        const PAGE_SIZE = 2;
        const TARGET_PAGE = 1;

        const clients = Array.from({ length: TOTAL_CLIENTS }, (_, index) => ({
          ...getFakeClient(false),
          name: `pagination-client-${String(index).padStart(2, '0')}`,
        }));

        await drizzle.insert(clientTable).values(clients);

        const res = await requestSender.getClients({
          queryParams: {
            page: TARGET_PAGE,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            page_size: PAGE_SIZE,
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(PAGE_SIZE);
        expect(res.body.total).toBe(TOTAL_CLIENTS);
      });

      it('should support pagination with different page numbers', async function () {
        // Generated by Copilot
        const TOTAL_CLIENTS = 7;
        const PAGE_SIZE = 3;
        const SECOND_PAGE = 2;

        const clients = Array.from({ length: TOTAL_CLIENTS }, (_, index) => ({
          ...getFakeClient(false),
          name: `page-test-client-${String(index).padStart(2, '0')}`,
        }));

        await drizzle.insert(clientTable).values(clients);

        const res = await requestSender.getClients({
          queryParams: {
            page: SECOND_PAGE,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            page_size: PAGE_SIZE,
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(PAGE_SIZE);
        expect(res.body.total).toBe(TOTAL_CLIENTS);
      });

      it('should handle last page with fewer items', async function () {
        // Generated by Copilot
        const TOTAL_CLIENTS = 5;
        const PAGE_SIZE = 3;
        const LAST_PAGE = 2;
        const EXPECTED_ITEMS_ON_LAST_PAGE = 2;

        const clients = Array.from({ length: TOTAL_CLIENTS }, (_, index) => ({
          ...getFakeClient(false),
          name: `last-page-client-${String(index).padStart(2, '0')}`,
        }));

        await drizzle.insert(clientTable).values(clients);

        const res = await requestSender.getClients({
          queryParams: {
            page: LAST_PAGE,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            page_size: PAGE_SIZE,
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(EXPECTED_ITEMS_ON_LAST_PAGE);
        expect(res.body.total).toBe(TOTAL_CLIENTS);
      });

      it('should support sorting by name in ascending order', async function () {
        const clientNames = ['zebra-client', 'alpha-client', 'beta-client'];
        const sortedNames = ['alpha-client', 'beta-client', 'zebra-client'];

        const clients = clientNames.map((name) => ({
          ...getFakeClient(false),
          name,
        }));

        await drizzle.insert(clientTable).values(clients);

        const res = await requestSender.getClients({
          queryParams: {
            sort: ['name:asc'],
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();

        expect(res.body.items).toHaveLength(clientNames.length);

        // Check if items are sorted correctly
        for (let i = 0; i < sortedNames.length; i++) {
          expect(res.body.items[i]?.name).toBe(sortedNames[i]);
        }
      });

      it('should support sorting by name in descending order', async function () {
        const clientNames = ['alpha-client', 'zebra-client', 'beta-client'];
        const sortedNamesDesc = ['zebra-client', 'beta-client', 'alpha-client'];

        const clients = clientNames.map((name) => ({
          ...getFakeClient(false),
          name,
        }));

        await drizzle.insert(clientTable).values(clients);
        const res = await requestSender.getClients({
          queryParams: {
            sort: ['name:desc'],
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();

        const items = res.body.items;

        expect(items).toHaveLength(clientNames.length);

        // Check if items are sorted correctly in descending order
        for (let i = 0; i < sortedNamesDesc.length; i++) {
          expect(items[i]?.name).toBe(sortedNamesDesc[i]);
        }
      });

      it('should support sorting by createdAt in ascending order', async function () {
        // Generated by Copilot
        const dates = [new Date('2023-01-01'), new Date('2023-03-01'), new Date('2023-02-01')];

        const clients = dates.map((date, index) => ({
          ...getFakeClient(false),
          name: `date-client-${index}`,
          createdAt: date,
        }));

        await drizzle.insert(clientTable).values(clients);

        const res = await requestSender.getClients({
          queryParams: {
            sort: ['created-at:asc'],
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toHaveLength(dates.length);

        // Check if items are sorted by createdAt in ascending order
        const sortedItems = res.body.items;
        for (let i = 0; i < sortedItems.length - 1; i++) {
          // Generated by Copilot
          const currentItem = sortedItems[i];
          const nextItem = sortedItems[i + 1];

          // Ensure createdAt exists before creating Date objects
          if (currentItem?.createdAt === undefined || nextItem?.createdAt === undefined) {
            expect.fail('createdAt is required for date comparison');
          }

          const currentDate = new Date(currentItem.createdAt);
          const nextDate = new Date(nextItem.createdAt);

          expect(currentDate.getTime()).toBeLessThanOrEqual(nextDate.getTime());
        }
      });

      it('should combine pagination and sorting', async function () {
        const TOTAL_CLIENTS = 6;
        const PAGE_SIZE = 2;
        const TARGET_PAGE = 2;

        const clients = Array.from({ length: TOTAL_CLIENTS }, (_, index) => ({
          ...getFakeClient(false),
          name: `combo-client-${String(index).padStart(2, '0')}`,
        }));

        await drizzle.insert(clientTable).values(clients);
        const res = await requestSender.getClients({
          queryParams: {
            page: TARGET_PAGE,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            page_size: PAGE_SIZE,
            sort: ['name:asc'],
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();

        const returnedItems = res.body.items;

        expect(returnedItems).toBeArrayOfSize(PAGE_SIZE);
        expect(res.body.total).toBe(TOTAL_CLIENTS); // Verify the specific items on page 2 with sorting

        const isFirstItemCorrect = returnedItems[0]?.name === 'combo-client-02';
        const isSecondItemCorrect = returnedItems[1]?.name === 'combo-client-03';

        expect(isFirstItemCorrect).toBe(true);
        expect(isSecondItemCorrect).toBe(true);
      });

      it('should return empty results for page beyond available data', async function () {
        // Generated by Copilot
        const TOTAL_CLIENTS = 3;
        const PAGE_SIZE = 5;
        const BEYOND_AVAILABLE_PAGE = 2;

        const clients = Array.from({ length: TOTAL_CLIENTS }, (_, index) => ({
          ...getFakeClient(false),
          name: `empty-test-client-${index}`,
        }));

        // const connection = depContainer.resolve(DataSource);
        // await connection.getRepository(Client).insert(clients.map((c) => ({ ...c })));
        await drizzle.insert(clientTable).values(clients);

        const res = await requestSender.getClients({
          queryParams: {
            page: BEYOND_AVAILABLE_PAGE,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            page_size: PAGE_SIZE,
          },
        });

        expectResponseStatus(res, httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body.items).toBeArrayOfSize(0);
        expect(res.body.total).toBe(TOTAL_CLIENTS);
      });

      it('should return 201 status code and the created client', async function () {
        const client = getFakeClient(false) as unknown as ApiClient;

        const res = await requestSender.createClient({ requestBody: client });

        expect(res).toHaveProperty('status', httpStatusCodes.CREATED);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(client);
      });
    });

    describe('GET /client/:clientName', function () {
      it('should return 200 status code and the client', async function () {
        const client = getFakeClient(false);

        // const connection = depContainer.resolve(DataSource);
        // await connection.getRepository(Client).insert({ ...client });
        await drizzle.insert(clientTable).values(client);

        const res = await requestSender.getClient({ pathParams: { clientName: client.name } });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject(client);
      });
    });

    describe('PATCH /client/:clientName', function () {
      it('should return 200 status code and the updated client', async function () {
        const client = getFakeClient(false);

        // const connection = depContainer.resolve(DataSource);
        // await connection.getRepository(Client).insert({ ...client });
        await drizzle.insert(clientTable).values(client);

        const res = await requestSender.updateClient({
          pathParams: { clientName: client.name },
          requestBody: {
            ...client,
            description: 'xd',
            tags: ['a', 'b'],
          } as unknown as ApiClient,
        });

        expect(res).toHaveProperty('status', httpStatusCodes.OK);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toMatchObject({ ...client, description: 'xd', tags: ['a', 'b'] });
      });
    });
  });

  describe('Bad Path', function () {
    describe('POST /client', function () {
      it('should return 400 status code if the name is too short', async function () {
        const client = getFakeClient(false) as unknown as ApiClient;
        client.name = 'a';

        const res = await requestSender.createClient({ requestBody: client });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'request/body/name must NOT have fewer than 2 characters' });
      });

      it('should return 400 status code if the name is too long', async function () {
        const client = getFakeClient(false) as unknown as ApiClient;
        client.name = faker.string.alpha(33);

        const res = await requestSender.createClient({ requestBody: client });

        expect(res).toHaveProperty('status', httpStatusCodes.BAD_REQUEST);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'request/body/name must NOT have more than 32 characters' });
      });

      it('should return 409 status code if client with the same name already exists', async function () {
        const client = getFakeClient(false) as unknown as ApiClient;

        const res1 = await requestSender.createClient({ requestBody: client });

        expect(res1).toHaveProperty('status', httpStatusCodes.CREATED);

        const res2 = await requestSender.createClient({ requestBody: client });

        expect(res2).toHaveProperty('status', httpStatusCodes.CONFLICT);
        expect(res2).toSatisfyApiSpec();
        expect(res2.body).toStrictEqual({ message: 'client already exists' });
      });
    });

    describe('GET /client/:clientName', function () {
      it('should return 404 status code if the client was not found', async function () {
        const res = await requestSender.getClient({ pathParams: { clientName: 'lol' } });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: "A client with the given name doesn't exists in the database" });
      });
    });

    describe('PATCH /client/:clientName', function () {
      it('should return 404 status code if the client was not found', async function () {
        const client = getFakeClient(false) as unknown as ApiClient;

        const res = await requestSender.updateClient({
          pathParams: { clientName: 'lol' },
          requestBody: client,
        });

        expect(res).toHaveProperty('status', httpStatusCodes.NOT_FOUND);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toStrictEqual({ message: 'client with given name was not found' });
      });
    });
  });

  describe('Sad Path', function () {
    afterEach(function () {
      vi.restoreAllMocks();
    });

    describe('GET /client', function () {
      it('should return 500 status code if db throws an error', async function () {
        // const repo = depContainer.resolve<ClientRepository>(SERVICES.CLIENT_REPOSITORY);
        // vi.spyOn(repo, 'findAndCount').mockRejectedValue(new Error());
        vi.spyOn(drizzle, 'select').mockRejectedValue(new Error());

        const res = await requestSender.getClients();

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('POST /client', function () {
      it('should return 500 status code if db throws an error', async function () {
        // const repo = depContainer.resolve<ClientRepository>(SERVICES.CLIENT_REPOSITORY);
        // vi.spyOn(repo, 'insert').mockRejectedValue(new Error());
        vi.spyOn(drizzle, 'insert').mockRejectedValue(new Error());

        const res = await requestSender.createClient({ requestBody: getFakeClient(false) as unknown as ApiClient });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('GET /client/:clientName', function () {
      it('should return 500 status code if db throws an error', async function () {
        // const repo = depContainer.resolve<ClientRepository>(SERVICES.CLIENT_REPOSITORY);
        // vi.spyOn(repo, 'findOne').mockRejectedValue(new Error());
        vi.spyOn(drizzle.query.client, 'findFirst').mockRejectedValue(new Error());

        const res = await requestSender.getClient({ pathParams: { clientName: 'avi' } });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });

    describe('PATCH /client/:clientName', function () {
      it('should return 500 status code if db throws an error', async function () {
        // const repo = depContainer.resolve<ClientRepository>(SERVICES.CLIENT_REPOSITORY);
        // vi.spyOn(repo, 'updateAndReturn').mockRejectedValue(new Error());
        vi.spyOn(drizzle, 'update').mockRejectedValue(new Error());

        const res = await requestSender.updateClient({
          pathParams: { clientName: 'avi' },
          requestBody: getFakeClient(false) as unknown as ApiClient,
        });

        expect(res).toHaveProperty('status', httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(res).toSatisfyApiSpec();
      });
    });
  });
});
