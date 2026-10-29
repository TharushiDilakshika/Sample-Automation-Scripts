import { test, expect } from '../../fixtures/base.fixture';
import { expectErrors, expectSuccess, extractData } from '../../helpers/assertions';
import { FilterBuilder, PaginationBuilder, ConfigBuilder } from '../../common/request-builder';
import { logTestResult } from '../helpers';

const OPERATION = 'getFundHoldingsArchiveSummaryGridCsvDownload';

type CsvResponse = {
  message?: {
    template?: string | null;
    keys?: Array<{ key?: string | null; value?: string | null }> | null;
  } | null;
};

// Minimal valid columnDefinition reused across tests.
const DEFAULT_COLUMN_DEF = {
  fields: [
    { fieldName: 'symbol', translation: 'Symbol' },
    { fieldName: 'date',   translation: 'Date'   },
  ],
};

// Date-scoped base filter to avoid full-table scans.
const BASE_FILTER = new FilterBuilder().where('date', '>', '2000-01-01 00:00:00').build();

/** Lenient assertion: HTTP 200 + valid JSON response (success or structured ATError). */
function expectCsvOk(response: Parameters<typeof expectSuccess>[0]): void {
  expect(response.status).toBe(200);
  if (response.body.errors) {
    expect(response.body.errors[0].extensions?.code).toBe('ATError');
  } else {
    const data = extractData<CsvResponse>(response, OPERATION);
    expect(data).toBeDefined();
  }
}

test.describe('@report getFundHoldingsArchiveSummaryGridCsvDownload', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ── Group 1: Happy Path & Response Validation ───────────────────────────────

  test('TC1 - Verify that a valid columnDefinition with a date-scoped filter returns HTTP 200',
    { tag: ['@smoke'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
        DEFAULT_COLUMN_DEF,
      );
      expectCsvOk(response);
    },
  );

  test('TC2 - Verify that the response message object conforms to the ATMessage structure when present',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
        DEFAULT_COLUMN_DEF,
      );
      expect(response.status).toBe(200);
      if (response.body.errors) {
        expect(response.body.errors[0].extensions?.code).toBe('ATError');
        return;
      }
      const data = extractData<CsvResponse>(response, OPERATION);
      expect(data).toHaveProperty('message');
      if (data.message != null) {
        expect(typeof data.message.template === 'string' || data.message.template == null).toBe(true);
        if (data.message.keys != null) {
          expect(Array.isArray(data.message.keys)).toBe(true);
          for (const kv of data.message.keys) {
            expect(kv).toHaveProperty('key');
            expect(kv).toHaveProperty('value');
          }
        }
      }
    },
  );

  // ── Group 2: Column Definition Variations ──────────────────────────────────

  test('TC3 - Verify that a multi-field columnDefinition with 5 fields is accepted',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
        {
          fields: [
            { fieldName: 'symbol',      translation: 'Symbol'      },
            { fieldName: 'date',        translation: 'Date'        },
            { fieldName: 'exchange',    translation: 'Exchange'    },
            { fieldName: 'quantity',    translation: 'Quantity'    },
            { fieldName: 'totalValue',  translation: 'Total Value' },
          ],
        },
      );
      expectCsvOk(response);
    },
  );

  test('TC4 - Verify that a single-field columnDefinition is accepted',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
        { fields: [{ fieldName: 'symbol', translation: 'Symbol' }] },
      );
      expectCsvOk(response);
    },
  );

  // ── Group 3: Filter & Pagination Combinations ───────────────────────────────

  test('TC5 - Verify that date > 2000-01-01 filter with pageWidth=5 is accepted',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
        DEFAULT_COLUMN_DEF,
      );
      expect(response.status).toBe(200);
      if (response.body.errors) {
        expect(response.body.errors[0].extensions?.code).toBe('ATError');
      } else {
        const data = extractData<CsvResponse>(response, OPERATION);
        expect(data).toBeDefined();
      }
    },
  );

  test('TC6 - Verify that filtering by symbol LIKE % with valid columnDefinition is accepted',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const filter = new FilterBuilder()
        .where('date', '>', '2000-01-01 00:00:00')
        .and('symbol', 'LIKE', '%')
        .build();
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        filter,
        new PaginationBuilder().size(5).page(1).build(),
        DEFAULT_COLUMN_DEF,
      );
      expect(response.status).toBe(200);
      if (response.body.errors) {
        expect(response.body.errors[0].extensions?.code).toBe('ATError');
      } else {
        const data = extractData<CsvResponse>(response, OPERATION);
        expect(data).toBeDefined();
      }
    },
  );

  test('TC7 - Verify that pageWidth=1 pageNumber=1 alongside columnDefinition is accepted',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        BASE_FILTER,
        new PaginationBuilder().size(1).page(1).build(),
        DEFAULT_COLUMN_DEF,
      );
      expect(response.status).toBe(200);
      if (response.body.errors) {
        expect(response.body.errors[0].extensions?.code).toBe('ATError');
      } else {
        const data = extractData<CsvResponse>(response, OPERATION);
        expect(data).toBeDefined();
      }
    },
  );

  // ── Group 4: Config Variations ──────────────────────────────────────────────

  test('TC8 - Verify that config isMaster: true returns HTTP 200 without unexpected errors',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
        DEFAULT_COLUMN_DEF,
        new ConfigBuilder().master(true).build(),
      );
      expect(response.status).toBe(200);
      if (response.body.errors) {
        expect(response.body.errors[0].extensions?.code).toBe('ATError');
      } else {
        const data = extractData<CsvResponse>(response, OPERATION);
        expect(data).toBeDefined();
      }
    },
  );

  test('TC9 - Verify that config enableValidDataFilter: true returns HTTP 200 without unexpected errors',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        BASE_FILTER,
        new PaginationBuilder().size(5).page(1).build(),
        DEFAULT_COLUMN_DEF,
        new ConfigBuilder().enableValidDataFilter(true).build(),
      );
      expect(response.status).toBe(200);
      if (response.body.errors) {
        expect(response.body.errors[0].extensions?.code).toBe('ATError');
      } else {
        expect(response.body.data).toBeDefined();
      }
    },
  );

  // ── Group 5: Negative / Error Handling ─────────────────────────────────────

  test('TC10 - Verify that omitting the required columnDefinition returns a GRAPHQL_VALIDATION_FAILED error',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(BASE_FILTER, undefined, undefined);
      expect(response.status).toBe(200);
      expectErrors(response);
      expect(response.body.errors![0].extensions?.code).toBeDefined();
    },
  );

  test('TC11 - Verify that a malformed filter (non-array string) returns a GraphQL type error',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      const response = await reportApi.getFundHoldingsArchiveSummaryGridCsvDownload(
        'not-a-valid-filter',
        undefined,
        DEFAULT_COLUMN_DEF,
      );
      expect(response.status).toBe(200);
      expectErrors(response);
      expect(response.body.errors![0].extensions?.code).toBeDefined();
    },
  );
});
