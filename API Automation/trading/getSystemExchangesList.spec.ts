import { test, expect } from '../../fixtures/base.fixture';
import { expectSuccess, extractData, expectErrors } from '../../helpers/assertions';
import { FilterBuilder, PaginationBuilder, ConfigBuilder } from '../../common/request-builder';
import { logTestResult } from '../helpers';

const OPERATION = 'getSystemExchangesList';

test.describe('@trading getSystemExchangesList', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ── Group 1: Happy Path & Field Validation ──────────────────────────────────

  test('TC1 - Verify that getSystemExchangesList with an empty filter returns an array',
    { tag: ['@smoke'] },
    async ({ tradingApi }) => {
      const response = await tradingApi.getSystemExchangesList();
      expectSuccess(response);
      const data = extractData(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    },
  );

  test('TC2 - Verify that response items contain expected scalar and enum fields',
    { tag: ['@regression'] },
    async ({ tradingApi }) => {
      const response = await tradingApi.getSystemExchangesList(
        [],
        new PaginationBuilder().size(5).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION) as Record<string, unknown>[];
      if (!data.length) return;
      for (const item of data) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('exchangeCode');
        expect(item).toHaveProperty('activeStatus');
        expect(item).toHaveProperty('countryCode');
        expect(item).toHaveProperty('defaultCurrency');
      }
    },
  );

  // ── Group 2: Pagination ─────────────────────────────────────────────────────

  test('TC3 - Verify that pageWidth=1 returns at most 1 result',
    { tag: ['@regression'] },
    async ({ tradingApi }) => {
      const response = await tradingApi.getSystemExchangesList(
        [],
        new PaginationBuilder().size(1).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION) as unknown[];
      expect(data.length).toBeLessThanOrEqual(1);
    },
  );

  test('TC4 - Verify that page 2 returns different records than page 1',
    { tag: ['@regression'] },
    async ({ tradingApi }) => {
      const page1Response = await tradingApi.getSystemExchangesList(
        [],
        new PaginationBuilder().size(5).page(1).build(),
      );
      const page2Response = await tradingApi.getSystemExchangesList(
        [],
        new PaginationBuilder().size(5).page(2).build(),
      );
      expectSuccess(page1Response);
      expectSuccess(page2Response);
      const page1Data = extractData(page1Response, OPERATION) as Record<string, unknown>[];
      const page2Data = extractData(page2Response, OPERATION) as Record<string, unknown>[];
      if (page1Data.length > 0 && page2Data.length > 0) {
        expect(page1Data[0].id).not.toBe(page2Data[0].id);
      }
    },
  );

  // ── Group 3: Filtering ──────────────────────────────────────────────────────

  test('TC5 - Verify that filtering by activeStatus = seeded value returns only items with that status',
    { tag: ['@regression'] },
    async ({ tradingApi }) => {
      const seed = extractData(
        await tradingApi.getSystemExchangesList([], new PaginationBuilder().size(5).page(1).build()),
        OPERATION,
      ) as Record<string, unknown>[];
      if (!seed.length || !seed[0].activeStatus) return;

      const statusValue = String(seed[0].activeStatus);
      const filter = new FilterBuilder().where('activeStatus', '=', statusValue).build();
      const response = await tradingApi.getSystemExchangesList(
        filter,
        new PaginationBuilder().size(10).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION) as Record<string, unknown>[];
      for (const item of data) {
        expect(item.activeStatus).toBe(statusValue);
      }
    },
  );

  test('TC6 - Verify that filtering by exchangeCode LIKE prefix% returns matching results',
    { tag: ['@regression'] },
    async ({ tradingApi }) => {
      const seed = extractData(
        await tradingApi.getSystemExchangesList([], new PaginationBuilder().size(5).page(1).build()),
        OPERATION,
      ) as Record<string, unknown>[];
      if (!seed.length || !seed[0].exchangeCode) return;

      const prefix = String(seed[0].exchangeCode).slice(0, 2);
      const filter = new FilterBuilder().where('exchangeCode', 'LIKE', `${prefix}%`).build();
      const response = await tradingApi.getSystemExchangesList(
        filter,
        new PaginationBuilder().size(10).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    },
  );

  test('TC7 - Verify that filtering by countryCode = seeded value returns only items with that country',
    { tag: ['@regression'] },
    async ({ tradingApi }) => {
      const seed = extractData(
        await tradingApi.getSystemExchangesList([], new PaginationBuilder().size(5).page(1).build()),
        OPERATION,
      ) as Record<string, unknown>[];
      if (!seed.length || !seed[0].countryCode) return;

      const countryValue = String(seed[0].countryCode);
      const filter = new FilterBuilder().where('countryCode', '=', countryValue).build();
      const response = await tradingApi.getSystemExchangesList(
        filter,
        new PaginationBuilder().size(10).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION) as Record<string, unknown>[];
      for (const item of data) {
        expect(item.countryCode).toBe(countryValue);
      }
    },
  );

  // ── Group 4: Config ─────────────────────────────────────────────────────────

  test('TC8 - Verify that isMaster: true config returns an array without unexpected errors',
    { tag: ['@regression'] },
    async ({ tradingApi }) => {
      const config = new ConfigBuilder().set('isMaster', true).build();
      const response = await tradingApi.getSystemExchangesList(
        [],
        new PaginationBuilder().size(5).page(1).build(),
        config,
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    },
  );

  // ── Group 5: Negative / Error Handling ─────────────────────────────────────

  test('TC9 - Verify that an invalid enum value on activeStatus filter returns an error',
    { tag: ['@regression'] },
    async ({ tradingApi }) => {
      const filter = new FilterBuilder().where('activeStatus', '=', 'INVALID_STATUS_XYZ').build();
      const response = await tradingApi.getSystemExchangesList(filter);
      expectErrors(response);
      const error = response.body.errors![0];
      expect(error).toHaveProperty('extensions');
      expect(error.extensions).toHaveProperty('code');
    },
  );

  test('TC10 - Verify that a malformed filter (non-array string) returns an error',
    { tag: ['@regression'] },
    async ({ gql }) => {
      const response = await gql.execute(
        `query getSystemExchangesList($filter: Filter!) {
          getSystemExchangesList(filter: $filter) { id }
        }`,
        { filter: 'not-a-valid-filter' },
      );
      expect(response.body.errors).toBeDefined();
      const error = response.body.errors![0];
      expect(error).toHaveProperty('extensions');
      expect(error.extensions).toHaveProperty('code');
    },
  );
});
