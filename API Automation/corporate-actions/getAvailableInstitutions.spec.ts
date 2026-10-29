import { test, expect } from '../../fixtures/base.fixture';
import { expectErrors, expectSuccess, extractData } from '../../helpers/assertions';
import { FilterBuilder, PaginationBuilder, ConfigBuilder } from '../../common/request-builder';
import { logTestResult } from '../helpers';

const OPERATION = 'getAvailableInstitutions';
const DATE_SCALAR_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

type InstitutionRow = {
  id?: number | null;
  institutionId?: number | null;
  createdDate?: string | null;
  branchCode?: string | null;
  branchName?: string | null;
  address?: string | null;
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

function rows(response: Awaited<ReturnType<typeof import('../../api/corporate-actions.api').CorporateActionsApi.prototype.getAvailableInstitutions>>): InstitutionRow[] {
  return extractData<InstitutionRow[]>(response, OPERATION);
}

function paginationMeta(response: Awaited<ReturnType<typeof import('../../api/corporate-actions.api').CorporateActionsApi.prototype.getAvailableInstitutions>>): PaginationMeta | undefined {
  return (response.body as ResponseBody).data?.additionalInfo?.pagination?.[OPERATION];
}

function isValidDateScalar(value: unknown): value is string {
  return typeof value === 'string' && DATE_SCALAR_PATTERN.test(value);
}

async function getSeedRows(
  masterCorporateActionsApi: import('../../api/corporate-actions.api').CorporateActionsApi,
  pageWidth = 100,
): Promise<InstitutionRow[]> {
  const response = await masterCorporateActionsApi.getAvailableInstitutions(
    [],
    new PaginationBuilder().size(pageWidth).page(1).build(),
  );
  expectSuccess(response);
  return rows(response);
}

test.describe('@corporate-actions getAvailableInstitutions', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ─── Group 1: Happy Path & Field Validation ───────────────────────────────

  test('TC1 - getAvailableInstitutions with empty filter returns a list response', { tag: ['@smoke'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
  });

  test('TC2 - response items contain expected scalar fields', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    if (data.length === 0) return;

    const first = data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('institutionId');
    expect(first).toHaveProperty('branchCode');
    expect(first).toHaveProperty('branchName');
    expect(first).toHaveProperty('createdDate');

    if (first.createdDate != null) {
      expect(isValidDateScalar(first.createdDate)).toBe(true);
    }
  });

  // ─── Group 2: Pagination ─────────────────────────────────────────────────

  test('TC3 - pageWidth=5 returns at most 5 rows', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(5).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  test('TC4 - pageNumber=2 returns a different slice than page 1 when enough data exists', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const r1 = await masterCorporateActionsApi.getAvailableInstitutions([], new PaginationBuilder().size(5).page(1).build());
    const r2 = await masterCorporateActionsApi.getAvailableInstitutions([], new PaginationBuilder().size(5).page(2).build());

    expectSuccess(r1);
    expectSuccess(r2);

    const d1 = rows(r1);
    const d2 = rows(r2);
    if (d1.length > 0 && d2.length > 0) {
      expect(d1[0].institutionId).not.toBe(d2[0].institutionId);
    }
  });

  test('TC5 - pagination metadata contains pageWidth, pageNumber and isNextPageAvailable', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(5).page(1).build(),
    );

    expectSuccess(response);
    const meta = paginationMeta(response);
    expect(meta).toBeDefined();
    expect(meta?.pageWidth).toBe(5);
    expect(meta?.pageNumber).toBe(1);
    expect(typeof meta?.isNextPageAvailable).toBe('boolean');
  });

  test('TC6 - pageWidth=20000 is accepted and silently clamped to 10000', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    test.setTimeout(90_000);

    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(20_000).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(10_000);

    const meta = paginationMeta(response);
    expect(meta).toBeDefined();
    expect(meta?.pageWidth).toBe(10_000);
  });

  // ─── Group 3: Filtering by Field ─────────────────────────────────────────

  test('TC7 - filter by institutionId with = returns only matching rows', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const seedData = await getSeedRows(masterCorporateActionsApi);
    const sample = seedData.find((r) => typeof r.institutionId === 'number');
    if (!sample) {
      test.skip(true, 'No rows with institutionId available for filter seeding.');
      return;
    }

    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('institutionId', '=', String(sample.institutionId)).build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (const row of data) {
      expect(row.institutionId).toBe(sample.institutionId);
    }
  });

  test('TC8 - filter by branchCode with = returns only matching rows', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const seedData = await getSeedRows(masterCorporateActionsApi);
    const sample = seedData.find((r) => typeof r.branchCode === 'string' && r.branchCode.trim().length > 0);
    if (!sample) {
      test.skip(true, 'No rows with branchCode available for filter seeding.');
      return;
    }

    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('branchCode', '=', sample.branchCode!).build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (const row of data) {
      expect(row.branchCode).toBe(sample.branchCode);
    }
  });

  test('TC9 - filter by branchName with LIKE returns rows containing the substring (case-insensitive)', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const seedData = await getSeedRows(masterCorporateActionsApi);
    const sample = seedData.find((r) => typeof r.branchName === 'string' && r.branchName.trim().length >= 3);
    if (!sample) {
      test.skip(true, 'No rows with a usable branchName for LIKE filter seeding.');
      return;
    }

    const substring = sample.branchName!.trim().slice(0, 3);
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('branchName', 'LIKE', `%${substring}%`).build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (const row of data) {
      expect(String(row.branchName ?? '').toLowerCase()).toContain(substring.toLowerCase());
    }
  });

  test('TC10 - filter by branchStatus with = "Active" is accepted by the backend', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    // branchStatus is not selected (it is owned by a different subgraph that errors under empty-filter).
    // We verify the filter syntax is accepted and the operation succeeds.
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('branchStatus', '=', 'Active').build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
  });

  test('TC11 - filter by branchStatus with != "Active" is accepted by the backend', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('branchStatus', '!=', 'Active').build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
  });

  // ─── Group 4: Date Filtering ──────────────────────────────────────────────

  test('TC12 - filter by createdDate with > and hardcoded past threshold is accepted by the backend', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const PAST_THRESHOLD = '1970-01-01 00:00:00';

    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('createdDate', '>', PAST_THRESHOLD).build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].message).not.toContain('Not a valid Filter');
    } else {
      const data = rows(response);
      expect(Array.isArray(data)).toBe(true);
      for (const row of data) {
        if (row.createdDate != null) {
          expect(isValidDateScalar(row.createdDate)).toBe(true);
          expect(row.createdDate > PAST_THRESHOLD).toBe(true);
        }
      }
    }
  });

  test('TC13 - filter by createdDate with = returns only rows matching that exact date', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const seedData = await getSeedRows(masterCorporateActionsApi, 200);
    const sample = seedData.find((r) => isValidDateScalar(r.createdDate));
    if (!sample) {
      test.skip(true, 'No rows with a valid createdDate available for exact date filter testing.');
      return;
    }

    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('createdDate', '=', sample.createdDate).build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(data.length).toBeGreaterThan(0);
    for (const row of data) {
      expect(row.createdDate).toBe(sample.createdDate);
    }
  });

  // ─── Group 5: Combined Filters & No-Match ────────────────────────────────

  test('TC14 - AND filter on institutionId and branchCode narrows the result set correctly', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const seedData = await getSeedRows(masterCorporateActionsApi);
    const sample = seedData.find(
      (r) => typeof r.institutionId === 'number' && typeof r.branchCode === 'string' && r.branchCode.trim().length > 0,
    );
    if (!sample) {
      test.skip(true, 'No rows with both institutionId and branchCode available for combined filter seeding.');
      return;
    }

    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder()
        .where('institutionId', '=', String(sample.institutionId))
        .and('branchCode', '=', sample.branchCode!)
        .build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(data.length).toBeGreaterThan(0);
    for (const row of data) {
      expect(row.institutionId).toBe(sample.institutionId);
      expect(row.branchCode).toBe(sample.branchCode);
    }
  });

  test('TC15 - filter by non-existent institutionId returns an empty array, not an error', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('institutionId', '=', '999999999').build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  // ─── Group 6: Sorting ─────────────────────────────────────────────────────

  test('TC16 - sort by institutionId ASC returns results in ascending order', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(20).page(1).sortBy('institutionId', 'ASC').build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].institutionId;
      const curr = data[i].institutionId;
      if (typeof prev === 'number' && typeof curr === 'number') {
        expect(prev).toBeLessThanOrEqual(curr);
      }
    }
  });

  test('TC17 - sort by institutionId DESC returns results in descending order', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(20).page(1).sortBy('institutionId', 'DESC').build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].institutionId;
      const curr = data[i].institutionId;
      if (typeof prev === 'number' && typeof curr === 'number') {
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    }
  });

  test('TC18 - sort by a non-existent field returns a GraphQL error', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(10).page(1).sortBy('nonExistentField', 'ASC').build(),
    );

    expect(response.status).toBe(200);
    expectErrors(response);
    expect(response.body.errors![0].extensions?.code).toBeDefined();
  });

  // ─── Group 7: Config Variations ───────────────────────────────────────────

  test.skip('TC19 - query succeeds with isMaster=true', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(10).page(1).build(),
      new ConfigBuilder().master(true).build(),
    );

    expectSuccess(response);
  });

  test('TC20 - query succeeds with enableValidDataFilter=true', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(10).page(1).build(),
      new ConfigBuilder().enableValidDataFilter(true).build(),
    );

    expectSuccess(response);
  });

  test('TC21 - query succeeds with isUserInstitutionFilter=true', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      [],
      new PaginationBuilder().size(10).page(1).build(),
      new ConfigBuilder().userInstitutionFilter(true).build(),
    );

    expectSuccess(response);
  });

  // ─── Group 8: Negative / Null Semantics ───────────────────────────────────

  test('TC22 - malformed filter payload returns a GraphQL error with extensions.code', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions('not-a-valid-filter');

    expect(response.status).toBe(200);
    expectErrors(response);
    expect(response.body.errors![0].extensions?.code).toBeDefined();
  });

  test('TC23 - IS_NULL on branchCode returns only null-valued rows when operator is supported', { tag: ['@regression'] }, async ({ masterCorporateActionsApi }) => {
    const response = await masterCorporateActionsApi.getAvailableInstitutions(
      new FilterBuilder().where('branchCode', 'IS_NULL').build(),
      new PaginationBuilder().size(500).page(1).build(),
    );

    expect(response.status).toBe(200);
    if (response.body.errors) {
      // IS_NULL not supported by this downstream service — structured rejection is acceptable
      expect(response.body.errors[0].extensions?.code).toBeDefined();
      return;
    }

    const data = rows(response);
    for (const row of data) {
      expect(row.branchCode ?? null).toBeNull();
    }
  });
});
