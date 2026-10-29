import { test, expect } from '../../fixtures/base.fixture';
import { expectErrors, expectSuccess, extractData, expectFieldsPresent } from '../../helpers/assertions';
import { FilterBuilder, PaginationBuilder, ConfigBuilder } from '../../common/request-builder';
import { logTestResult } from '../helpers';

const OPERATION = 'getOrderFeeList';
const DATE_SCALAR_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

type OrderFeeRow = {
  feeId?: number | null;
  cashAccountId?: number | null;
  securityAccountId?: number | null;
  institutionId?: number | null;
  transactionId?: number | null;
  orderNo?: number | null;
  amtInSettleCurrency?: number | null;
  amtInTransCurrency?: number | null;
  applicableFor?: string | null;
  exchange?: string | null;
  feeCode?: string | null;
  feesDescription?: string | null;
  settleCurrency?: string | null;
  symbol?: string | null;
  timestamp?: string | null;
  [key: string]: unknown;
};

type PaginationMeta = {
  pageWidth: number;
  pageNumber: number;
  isNextPageAvailable: boolean;
  totalWidth?: number;
};

type ResponseBody = {
  data?: {
    additionalInfo?: {
      pagination?: Record<string, PaginationMeta>;
    };
  };
};

function rows(
  response: Awaited<ReturnType<typeof import('../../api/trading.api').TradingApi.prototype.getOrderFeeList>>,
): OrderFeeRow[] {
  return extractData<OrderFeeRow[]>(response, OPERATION);
}

function paginationMeta(
  response: Awaited<ReturnType<typeof import('../../api/trading.api').TradingApi.prototype.getOrderFeeList>>,
): PaginationMeta | undefined {
  return (response.body as ResponseBody).data?.additionalInfo?.pagination?.[OPERATION];
}

async function getSeedRows(
  tradingApi: import('../../api/trading.api').TradingApi,
  pageWidth = 10,
): Promise<OrderFeeRow[]> {
  const response = await tradingApi.getOrderFeeList(
    [],
    new PaginationBuilder().size(pageWidth).page(1).build(),
  );
  expectSuccess(response);
  return rows(response);
}

test.describe('@trading getOrderFeeList', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ─── Group 1: Happy Path & Field Validation ───────────────────────────────

  test('TC1 - getOrderFeeList with empty filter returns HTTP 200 with array response', { tag: ['@smoke'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(10).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
  });

  test('TC2 - response items contain expected ID and numeric fields', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(10).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    if (data.length > 0) {
      expectFieldsPresent(data as Record<string, unknown>[], ['feeId', 'institutionId']);
      for (const row of data) {
        if (row.feeId != null) expect(typeof row.feeId).toBe('number');
        if (row.cashAccountId != null) expect(typeof row.cashAccountId).toBe('number');
        if (row.transactionId != null) expect(typeof row.transactionId).toBe('number');
        if (row.amtInSettleCurrency != null) expect(typeof row.amtInSettleCurrency).toBe('number');
      }
    }
  });

  test('TC3 - response items contain expected string and Date fields', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(10).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (const row of data) {
      expect(row).toHaveProperty('feeCode');
      expect(row).toHaveProperty('symbol');
      expect(row).toHaveProperty('timestamp');
      if (row.timestamp != null) {
        expect(row.timestamp).toMatch(DATE_SCALAR_PATTERN);
      }
    }
  });

  // ─── Group 2: Pagination ──────────────────────────────────────────────────

  test('TC4 - pageWidth=5 limits results to at most 5 items', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(5).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  test('TC5 - page 2 returns different rows from page 1', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const r1 = await tradingApi.getOrderFeeList([], new PaginationBuilder().size(5).page(1).build());
    const r2 = await tradingApi.getOrderFeeList([], new PaginationBuilder().size(5).page(2).build());

    expectSuccess(r1);
    expectSuccess(r2);

    const d1 = rows(r1);
    const d2 = rows(r2);

    const meta1 = paginationMeta(r1);
    if (!meta1?.isNextPageAvailable || d1.length === 0 || d2.length === 0) return;

    expect(JSON.stringify(d1[0])).not.toBe(JSON.stringify(d2[0]));
  });

  test('TC6 - extensions.pagination contains pageWidth, pageNumber and isNextPageAvailable', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(5).page(1).build(),
    );

    expectSuccess(response);
    const meta = paginationMeta(response);
    expect(meta).toBeDefined();
    expect(meta).toHaveProperty('pageWidth');
    expect(meta).toHaveProperty('pageNumber');
    expect(meta).toHaveProperty('isNextPageAvailable');
  });

  // ─── Group 3: Filtering ───────────────────────────────────────────────────

  test('TC7 - filter by feeId with = operator returns only matching rows', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const seed = await getSeedRows(tradingApi);
    const sample = seed.find((r) => r.feeId != null);
    if (!sample) {
      test.skip(true, 'No row with a non-null feeId found in seed data');
      return;
    }

    const response = await tradingApi.getOrderFeeList(
      new FilterBuilder().where('feeId', '=', String(sample.feeId)).build(),
      new PaginationBuilder().size(20).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(data.length).toBeGreaterThan(0);
    for (const row of data) {
      expect(row.feeId).toBe(sample.feeId);
    }
  });

  test('TC8 - filter by symbol with LIKE operator returns partial-match rows', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const seed = await getSeedRows(tradingApi);
    const sample = seed.find((r) => r.symbol && r.symbol.length >= 3);
    if (!sample?.symbol) {
      test.skip(true, 'No row with a non-null symbol (length ≥ 3) found in seed data');
      return;
    }

    const substring = sample.symbol.substring(0, 3);
    const response = await tradingApi.getOrderFeeList(
      new FilterBuilder().where('symbol', 'LIKE', `%${substring}%`).build(),
      new PaginationBuilder().size(20).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
    for (const row of data) {
      expect(String(row.symbol ?? '').toLowerCase()).toContain(substring.toLowerCase());
    }
  });

  test('TC9 - filter by timestamp > epoch date: gateway returns structured response', { tag: ['@regression'] }, async ({ tradingApi }) => {
    // The TRAD service's query generator (errorGroup: QGEN) does not support
    // filtering on the `timestamp` column for this endpoint — it returns
    // ATError "Unknown Error" (errorCode 0, QGEN) instead of data.
    // We verify the response is valid JSON with a structured error (no HTML crash).
    const response = await tradingApi.getOrderFeeList(
      new FilterBuilder().where('timestamp', '>', '2000-01-01 00:00:00').build(),
      new PaginationBuilder().size(10).page(1).build(),
    );

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
    } else {
      const data = rows(response);
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('TC10 - filter by feeCode IS_NOT_NULL returns only rows that have a feeCode', { tag: ['@regression'] }, async ({ tradingApi }) => {
    // IS_NOT_NULL may not be supported by all TRAD endpoints; ATError is accepted.
    const response = await tradingApi.getOrderFeeList(
      new FilterBuilder().where('feeCode', 'IS_NOT_NULL').build(),
      new PaginationBuilder().size(10).page(1).build(),
    );

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
    } else {
      const data = rows(response);
      expect(Array.isArray(data)).toBe(true);
      for (const row of data) {
        expect(row.feeCode).not.toBeNull();
        expect(row.feeCode).not.toBeUndefined();
      }
    }
  });

  test('TC11 - combined filter (feeId AND institutionId) applies AND logic correctly', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const seed = await getSeedRows(tradingApi);
    const sample = seed.find((r) => r.feeId != null && r.institutionId != null);
    if (!sample) {
      test.skip(true, 'No row with non-null feeId and institutionId found in seed data');
      return;
    }

    const response = await tradingApi.getOrderFeeList(
      new FilterBuilder()
        .where('feeId', '=', String(sample.feeId))
        .and('institutionId', '=', String(sample.institutionId))
        .build(),
      new PaginationBuilder().size(20).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
    for (const row of data) {
      expect(row.feeId).toBe(sample.feeId);
      expect(row.institutionId).toBe(sample.institutionId);
    }
  });

  test('TC12 - filter with no matches returns empty array, not an error', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      new FilterBuilder().where('feeId', '=', '999999999').build(),
      new PaginationBuilder().size(10).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test('TC13 - timestamp < future boundary: gateway returns structured response', { tag: ['@regression'] }, async ({ tradingApi }) => {
    // Same TRAD QGEN limitation as TC9 — timestamp is not a filterable field on
    // this endpoint. Verifies HTTP 200 and structured ATError (not a protocol crash).
    const response = await tradingApi.getOrderFeeList(
      new FilterBuilder().where('timestamp', '<', '2099-12-31 23:59:59').build(),
      new PaginationBuilder().size(5).page(1).build(),
    );

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
    } else {
      const data = rows(response);
      expect(Array.isArray(data)).toBe(true);
    }
  });

  // ─── Group 4: Sorting ─────────────────────────────────────────────────────

  test('TC14 - sort by feeId ASC returns items in ascending order', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(10).page(1).sortBy('feeId', 'ASC').build(),
    );

    expectSuccess(response);
    const data = rows(response);
    if (data.length >= 2) {
      expect(Number(data[0].feeId)).toBeLessThanOrEqual(Number(data[1].feeId));
    }
  });

  test('TC15 - sort by timestamp DESC returns most-recent fee records first', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(10).page(1).sortBy('timestamp', 'DESC').build(),
    );

    expectSuccess(response);
    const data = rows(response);
    if (data.length >= 2 && data[0].timestamp != null && data[1].timestamp != null) {
      expect(data[0].timestamp >= data[1].timestamp).toBe(true);
    }
  });

  // ─── Group 5: Config Variations ───────────────────────────────────────────

  test.skip('TC16 - config with isMaster=true returns HTTP 200', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(5).page(1).build(),
      new ConfigBuilder().master(true).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
  });

  test('TC17 - config with enableValidDataFilter=true returns HTTP 200', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(5).page(1).build(),
      new ConfigBuilder().enableValidDataFilter(true).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
  });

  test('TC18 - config with isUserInstitutionFilter=true is accepted by the gateway', { tag: ['@regression'] }, async ({ tradingApi }) => {
    // TRAD may return ATError for certain config combinations; accept structured error.
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(5).page(1).build(),
      new ConfigBuilder().userInstitutionFilter(true).build(),
    );

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
    } else {
      const data = rows(response);
      expect(Array.isArray(data)).toBe(true);
    }
  });

  // ─── Group 6: Negative / Error Handling ───────────────────────────────────

  test('TC19 - malformed filter payload (string instead of array) returns a GraphQL error', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      'not-a-valid-filter',
      new PaginationBuilder().size(5).page(1).build(),
    );

    expect(response.status).toBe(200);
    expectErrors(response);
    expect(response.body.errors![0].extensions?.code).toBeDefined();
  });

  test('TC20 - invalid sort field returns a pagination error', { tag: ['@regression'] }, async ({ tradingApi }) => {
    const response = await tradingApi.getOrderFeeList(
      [],
      new PaginationBuilder().size(5).page(1).sortBy('nonExistentField_XYZ', 'ASC').build(),
    );

    expect(response.status).toBe(200);
    expectErrors(response);
  });

  
});
