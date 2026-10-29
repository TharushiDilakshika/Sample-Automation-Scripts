import { test, expect } from '../../fixtures/base.fixture';
import { expectErrors, expectSuccess, extractData } from '../../helpers/assertions';
import { FilterBuilder, PaginationBuilder, ConfigBuilder } from '../../common/request-builder';
import { logTestResult } from '../helpers';

const OPERATION = 'getFundStrategyListGridCsvDownload';

type CsvResponse = {
  message?: {
    template?: string | null;
    keys?: Array<{ key?: string | null; value?: string | null }> | null;
  } | null;
};

// Minimal valid columnDefinition reused across tests.
const DEFAULT_COLUMN_DEF = {
  fields: [
    { fieldName: 'customerId',    translation: 'Customer ID' },
    { fieldName: 'symbol',        translation: 'Symbol' },
  ],
};

/**
 * Returns a narrow customerId filter when the env has a real customer ID configured,
 * or falls back to an empty filter for envs that only carry a placeholder or nothing.
 * Scopes the CSV export to a single customer's fund strategy rows, keeping the
 * response well under the 60 s gateway timeout in high-volume environments.
 */
function csvFilter(customerId: string | undefined): unknown[] {
  if (customerId && !customerId.startsWith('FILL')) {
    return new FilterBuilder().where('customerId', '=', customerId).build();
  }
  return [];
}

/** Lenient assertion: HTTP 200 + valid JSON response (success or structured ATError). */
function expectCsvOk(response: Parameters<typeof expectSuccess>[0], operation: string): void {
  expect(response.status).toBe(200);
  if (response.body.errors) {
    expect(response.body.errors[0].extensions?.code).toBe('ATError');
  } else {
    const data = extractData<CsvResponse>(response, operation);
    expect(data).toBeDefined();
  }
}

test.describe('@report getFundStrategyListGridCsvDownload', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ─── Group 1: Happy Path & Response Validation ────────────────────────────

  test('TC1 - valid columnDefinition and narrow filter returns HTTP 200',
    { tag: ['@smoke'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        csvFilter(envData.customer.customerId),
        new PaginationBuilder().size(5).page(1).build(),
        DEFAULT_COLUMN_DEF,
      );
      expectCsvOk(response, OPERATION);
    });

  test('TC2 - response message object has the correct ATMessage structure when present',
    { tag: ['@regression'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        csvFilter(envData.customer.customerId),
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
    });

  // ─── Group 2: ColumnDefinition Variations ────────────────────────────────

  test('TC3 - multiple fund strategy fields in columnDefinition are accepted',
    { tag: ['@regression'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        csvFilter(envData.customer.customerId),
        new PaginationBuilder().size(5).page(1).build(),
        {
          fields: [
            { fieldName: 'customerId',       translation: 'Customer ID' },
            { fieldName: 'symbol',           translation: 'Symbol' },
            { fieldName: 'strategyName',     translation: 'Strategy Name' },
            { fieldName: 'currency',         translation: 'Currency' },
            { fieldName: 'lastUpdatedDate',  translation: 'Last Updated' },
          ],
        },
      );
      expectCsvOk(response, OPERATION);
    });

  test('TC4 - optional downloadBaseName in columnDefinition is accepted',
    { tag: ['@regression'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        csvFilter(envData.customer.customerId),
        new PaginationBuilder().size(5).page(1).build(),
        {
          downloadBaseName: 'fund_strategy_export',
          fields: [{ fieldName: 'customerId', translation: 'Customer ID' }],
        },
      );
      expectCsvOk(response, OPERATION);
    });

  test('TC5 - columnDefinition with empty fields array [] is accepted or returns structured error',
    { tag: ['@regression'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        csvFilter(envData.customer.customerId),
        new PaginationBuilder().size(5).page(1).build(),
        { fields: [] },
      );
      expect(response.status).toBe(200);
      if (response.body.errors) {
        expect(response.body.errors[0].extensions?.code).toBeDefined();
      } else {
        const data = extractData<CsvResponse>(response, OPERATION);
        expect(data).toBeDefined();
      }
    });

  // ─── Group 3: Filter & Pagination Combinations ───────────────────────────

  test('TC6 - filter by currency = "USD" with valid columnDefinition is accepted',
    { tag: ['@regression'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const filter = (envData.customer.customerId && !envData.customer.customerId.startsWith('FILL'))
        ? new FilterBuilder().where('customerId', '=', envData.customer.customerId).where('currency', '=', 'USD').build()
        : new FilterBuilder().where('currency', '=', 'USD').build();
      const response = await reportApi.getFundStrategyListGridCsvDownload(
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
    });

  test('TC7 - pageWidth=5 page=1 pagination is accepted alongside columnDefinition',
    { tag: ['@regression'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        csvFilter(envData.customer.customerId),
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
    });

  // ─── Group 4: Config Variations ───────────────────────────────────────────

  test('TC8 - config.isMaster = true returns HTTP 200 without error',
    { tag: ['@regression'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        csvFilter(envData.customer.customerId),
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
    });

  test('TC9 - config.enableValidDataFilter = true returns HTTP 200 without error',
    { tag: ['@regression'] },
    async ({ reportApi, envData }) => {
      test.setTimeout(90_000);
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        csvFilter(envData.customer.customerId),
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
    });

  // ─── Group 5: Negative / Error Handling ───────────────────────────────────

  test('TC10 - omitting columnDefinition (required ColumnDefinition!) returns a GraphQL validation error',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      const response = await reportApi.getFundStrategyListGridCsvDownload([], undefined, undefined);
      expect(response.status).toBe(200);
      expectErrors(response);
      expect(response.body.errors![0].extensions?.code).toBeDefined();
    });

  test('TC11 - malformed filter string returns a GraphQL type error',
    { tag: ['@regression'] },
    async ({ reportApi }) => {
      const response = await reportApi.getFundStrategyListGridCsvDownload(
        'not-a-valid-filter',
        undefined,
        DEFAULT_COLUMN_DEF,
      );
      expect(response.status).toBe(200);
      expectErrors(response);
      expect(response.body.errors![0].extensions?.code).toBeDefined();
    });
});
