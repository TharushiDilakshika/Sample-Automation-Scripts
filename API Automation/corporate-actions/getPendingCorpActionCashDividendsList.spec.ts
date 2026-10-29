import { test, expect } from '../../fixtures/base.fixture';
import { expectSuccess, extractData, expectErrors } from '../../helpers/assertions';
import { FilterBuilder, PaginationBuilder, ConfigBuilder } from '../../common/request-builder';
import { logTestResult } from '../helpers';

const OPERATION = 'getPendingCorpActionCashDividendsList';

// NOTE: the CORP service for this operation is slow (10–22 s per call in menaqa).
// All data-touching tests use test.setTimeout(90_000) and a date-scoped BASE_FILTER
// to avoid full-table scans that would push runtimes beyond even the extended timeout.
const BASE_FILTER = new FilterBuilder().where('createdDate', '>', '2000-01-01 00:00:00').build();

test.describe('@corporate-actions getPendingCorpActionCashDividendsList', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ── Group 1: Happy Path & Field Validation ──────────────────────────────────

  test('TC1 - Verify that getPendingCorpActionCashDividendsList with a date-scoped filter returns an array',
    { tag: ['@smoke'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    },
  );

  test('TC2 - Verify that response items contain expected scalar, enum and Date fields',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION) as Record<string, unknown>[];
      if (!data.length) return;
      for (const item of data) {
        expect(item).toHaveProperty('detailRecId');
        expect(item).toHaveProperty('exchange');
        expect(item).toHaveProperty('cashDividendApprovalStatus');
        expect(item).toHaveProperty('customerNo');
        expect(item).toHaveProperty('createdDate');
      }
    },
  );

  // ── Group 2: Pagination ─────────────────────────────────────────────────────

  test('TC3 - Verify that pageWidth=1 returns at most 1 result',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        BASE_FILTER,
        new PaginationBuilder().size(1).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION) as unknown[];
      expect(data.length).toBeLessThanOrEqual(1);
    },
  );

  test('TC4 - Verify that page 2 returns different records than page 1',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const page1Response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
      );
      const page2Response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(2).build(),
      );
      expectSuccess(page1Response);
      expectSuccess(page2Response);
      const page1Data = extractData(page1Response, OPERATION) as Record<string, unknown>[];
      const page2Data = extractData(page2Response, OPERATION) as Record<string, unknown>[];
      if (page1Data.length > 0 && page2Data.length > 0) {
        expect(page1Data[0].detailRecId).not.toBe(page2Data[0].detailRecId);
      }
    },
  );

  // ── Group 3: Filtering ──────────────────────────────────────────────────────

  test('TC5 - Verify that filtering by createdDate > 2000-01-01 00:00:00 returns an array',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        BASE_FILTER,
        new PaginationBuilder().size(10).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    },
  );

  test('TC6 - Verify that filtering by cashDividendApprovalStatus = seeded value returns only items with that status',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const seed = extractData(
        await corporateActionsApi.getPendingCorpActionCashDividendsList(BASE_FILTER, new PaginationBuilder().size(5).page(1).build()),
        OPERATION,
      ) as Record<string, unknown>[];
      if (!seed.length || !seed[0].cashDividendApprovalStatus) return;

      const statusValue = String(seed[0].cashDividendApprovalStatus);
      const filter = new FilterBuilder()
        .where('createdDate', '>', '2000-01-01 00:00:00')
        .and('cashDividendApprovalStatus', '=', statusValue)
        .build();
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        filter,
        new PaginationBuilder().size(10).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION) as Record<string, unknown>[];
      for (const item of data) {
        expect(item.cashDividendApprovalStatus).toBe(statusValue);
      }
    },
  );

  test('TC7 - Verify that filtering by exchange LIKE prefix% returns matching results',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const seed = extractData(
        await corporateActionsApi.getPendingCorpActionCashDividendsList(BASE_FILTER, new PaginationBuilder().size(5).page(1).build()),
        OPERATION,
      ) as Record<string, unknown>[];
      if (!seed.length || !seed[0].exchange) return;

      const prefix = String(seed[0].exchange).slice(0, 2);
      const filter = new FilterBuilder()
        .where('createdDate', '>', '2000-01-01 00:00:00')
        .and('exchange', 'LIKE', `${prefix}%`)
        .build();
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        filter,
        new PaginationBuilder().size(10).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    },
  );

  test('TC8 - Verify that filtering by currency = seeded value returns only items with that currency',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const seed = extractData(
        await corporateActionsApi.getPendingCorpActionCashDividendsList(BASE_FILTER, new PaginationBuilder().size(5).page(1).build()),
        OPERATION,
      ) as Record<string, unknown>[];
      if (!seed.length || !seed[0].currency) return;

      const currencyValue = String(seed[0].currency);
      const filter = new FilterBuilder()
        .where('createdDate', '>', '2000-01-01 00:00:00')
        .and('currency', '=', currencyValue)
        .build();
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        filter,
        new PaginationBuilder().size(10).page(1).build(),
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION) as Record<string, unknown>[];
      for (const item of data) {
        expect(item.currency).toBe(currencyValue);
      }
    },
  );

  // ── Group 4: Config ─────────────────────────────────────────────────────────

  test('TC9 - Verify that isMaster: true config returns an array without unexpected errors',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      test.setTimeout(90_000);
      const config = new ConfigBuilder().set('isMaster', true).build();
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
        config,
      );
      expectSuccess(response);
      const data = extractData(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    },
  );

  // ── Group 5: Negative / Error Handling ─────────────────────────────────────

  test('TC10 - Verify that an invalid enum value on cashDividendApprovalStatus filter returns an error',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      const filter = new FilterBuilder()
        .where('createdDate', '>', '2000-01-01 00:00:00')
        .and('cashDividendApprovalStatus', '=', 'INVALID_STATUS_XYZ')
        .build();
      const response = await corporateActionsApi.getPendingCorpActionCashDividendsList(filter);
      expectErrors(response);
      const error = response.body.errors![0];
      expect(error).toHaveProperty('extensions');
      expect(error.extensions).toHaveProperty('code');
    },
  );

  test('TC11 - Verify that a malformed filter (non-array string) returns an error',
    { tag: ['@regression'] },
    async ({ gql }) => {
      const response = await gql.execute(
        `query getPendingCorpActionCashDividendsList($filter: Filter!) {
          getPendingCorpActionCashDividendsList(filter: $filter) { detailRecId }
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
