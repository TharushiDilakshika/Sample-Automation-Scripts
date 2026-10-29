import { test, expect } from '../../fixtures/base.fixture';
import { expectErrors, expectSuccess, extractData } from '../../helpers/assertions';
import { FilterBuilder, PaginationBuilder, ConfigBuilder } from '../../common/request-builder';
import { logTestResult } from '../helpers';

const OPERATION = 'getBeneficialOwnerWhsList';
const DATE_SCALAR_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

type Row = {
  accountHolderName?: string | null;
  countryOfIncorporation?: string | null;
  countryOfTaxResidence?: string | null;
  effectiveDate?: string | null;
  institutionId?: number | null;
  institutionName?: string | null;
  subAccountInternalId?: number | null;
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

function rows(response: Awaited<ReturnType<typeof import('../../api/finance.api').FinanceApi.prototype.getBeneficialOwnerWhsList>>): Row[] {
  return extractData<Row[]>(response, OPERATION);
}

function paginationMeta(response: Awaited<ReturnType<typeof import('../../api/finance.api').FinanceApi.prototype.getBeneficialOwnerWhsList>>): PaginationMeta | undefined {
  return (response.body as ResponseBody).data?.additionalInfo?.pagination?.[OPERATION];
}

function isValidDateScalar(value: unknown): value is string {
  return typeof value === 'string' && DATE_SCALAR_PATTERN.test(value);
}

test.describe('@finance getBeneficialOwnerWhsList', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ─── Group 1: Happy Path & Field Validation ───────────────────────────────

  test('TC1 - getBeneficialOwnerWhsList with empty filter returns a list response', { tag: ['@smoke'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList([]);

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
  });

  test('TC2 - response items contain expected fields and valid effectiveDate format when present', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList([]);

    expectSuccess(response);
    const data = rows(response);
    if (data.length === 0) return;

    const first = data[0];
    expect(first).toHaveProperty('institutionId');
    expect(first).toHaveProperty('subAccountInternalId');
    expect(first).toHaveProperty('accountHolderName');
    expect(first).toHaveProperty('countryOfIncorporation');
    expect(first).toHaveProperty('effectiveDate');

    if (first.effectiveDate != null) {
      expect(isValidDateScalar(first.effectiveDate)).toBe(true);
    }
  });

  // ─── Group 2: Pagination ─────────────────────────────────────────────────

  test('TC3 - pageWidth=5 returns at most 5 rows', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      [],
      new PaginationBuilder().size(5).page(1).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(data.length).toBeLessThanOrEqual(5);
  });

  test('TC4 - pageNumber=2 returns a different slice than page 1 when enough data exists', { tag: ['@regression'] }, async ({ financeApi }) => {
    const r1 = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(5).page(1).build());
    const r2 = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(5).page(2).build());

    expectSuccess(r1);
    expectSuccess(r2);

    const d1 = rows(r1);
    const d2 = rows(r2);

    if (d1.length > 0 && d2.length > 0) {
      expect(d1[0].subAccountInternalId).not.toBe(d2[0].subAccountInternalId);
    }
  });

  test('TC5 - pagination metadata contains pageWidth, pageNumber and isNextPageAvailable', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
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

  test('TC6 - pageWidth=20000 is accepted and silently clamped to 10000', { tag: ['@regression'] }, async ({ financeApi }) => {
    test.setTimeout(90_000);

    const response = await financeApi.getBeneficialOwnerWhsList(
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

  test('TC7 - filter by institutionId with = returns only matching rows', { tag: ['@regression'] }, async ({ financeApi }) => {
    const seed = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(100).page(1).build());
    expectSuccess(seed);
    const seedData = rows(seed);
    const sample = seedData.find((r) => typeof r.institutionId === 'number');
    if (!sample) {
      test.skip(true, 'No rows with institutionId available for seeding.');
      return;
    }

    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('institutionId', '=', String(sample.institutionId)).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (const row of data) {
      expect(row.institutionId).toBe(sample.institutionId);
    }
  });

  test('TC8 - filter by subAccountInternalId with = returns only matching rows', { tag: ['@regression'] }, async ({ financeApi }) => {
    const seed = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(100).page(1).build());
    expectSuccess(seed);
    const seedData = rows(seed);
    const sample = seedData.find((r) => typeof r.subAccountInternalId === 'number');
    if (!sample) {
      test.skip(true, 'No rows with subAccountInternalId available for seeding.');
      return;
    }

    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('subAccountInternalId', '=', String(sample.subAccountInternalId)).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (const row of data) {
      expect(row.subAccountInternalId).toBe(sample.subAccountInternalId);
    }
  });

  test('TC9 - filter by institutionId with != excludes the seeded value', { tag: ['@regression'] }, async ({ financeApi }) => {
    const seed = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(100).page(1).build());
    expectSuccess(seed);
    const seedData = rows(seed);
    const sample = seedData.find((r) => typeof r.institutionId === 'number');
    if (!sample) {
      test.skip(true, 'No rows with institutionId available for seeding.');
      return;
    }

    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('institutionId', '!=', String(sample.institutionId)).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (const row of data) {
      expect(row.institutionId).not.toBe(sample.institutionId);
    }
  });

  test('TC10 - filter by accountHolderName with LIKE returns rows containing the substring (case-insensitive)', { tag: ['@regression'] }, async ({ financeApi }) => {
    const seed = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(100).page(1).build());
    expectSuccess(seed);
    const seedData = rows(seed);
    const sample = seedData.find((r) => typeof r.accountHolderName === 'string' && r.accountHolderName.trim().length >= 3);
    if (!sample) {
      test.skip(true, 'No rows with a usable accountHolderName available for LIKE seeding.');
      return;
    }

    const substring = sample.accountHolderName!.trim().slice(0, 3);
    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('accountHolderName', 'LIKE', `%${substring}%`).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (const row of data) {
      expect(String(row.accountHolderName ?? '').toLowerCase()).toContain(substring.toLowerCase());
    }
  });

  // ─── Group 4: Combined Filters & Date Filtering ───────────────────────────

  test('TC11 - AND filter on institutionId + subAccountInternalId returns only matching rows', { tag: ['@regression'] }, async ({ financeApi }) => {
    const seed = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(100).page(1).build());
    expectSuccess(seed);
    const seedData = rows(seed);
    const sample = seedData.find(
      (r) => typeof r.institutionId === 'number' && typeof r.subAccountInternalId === 'number',
    );
    if (!sample) {
      test.skip(true, 'No rows with both institutionId and subAccountInternalId for combined filter seeding.');
      return;
    }

    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder()
        .where('institutionId', '=', String(sample.institutionId))
        .and('subAccountInternalId', '=', String(sample.subAccountInternalId))
        .build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(data.length).toBeGreaterThan(0);
    for (const row of data) {
      expect(row.institutionId).toBe(sample.institutionId);
      expect(row.subAccountInternalId).toBe(sample.subAccountInternalId);
    }
  });

  test('TC12 - filter with a non-existent subAccountInternalId returns an empty array, not an error', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('subAccountInternalId', '=', '999999999').build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  test('TC13 - filter by effectiveDate with = returns only rows matching that date', { tag: ['@regression'] }, async ({ financeApi }) => {
    const seed = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(200).page(1).build());
    expectSuccess(seed);
    const seedData = rows(seed);
    const sample = seedData.find((r) => isValidDateScalar(r.effectiveDate));
    if (!sample) {
      test.skip(true, 'No rows with a valid effectiveDate available for exact date filter testing.');
      return;
    }

    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('effectiveDate', '=', sample.effectiveDate).build(),
    );

    expectSuccess(response);
    const data = rows(response);
    expect(data.length).toBeGreaterThan(0);
    for (const row of data) {
      expect(row.effectiveDate).toBe(sample.effectiveDate);
    }
  });

  test('TC14 - filter by effectiveDate with > and hardcoded past threshold is accepted by the backend', { tag: ['@regression'] }, async ({ financeApi }) => {
    const PAST_THRESHOLD = '1970-01-01 00:00:00';

    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('effectiveDate', '>', PAST_THRESHOLD).build(),
    );

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].message).not.toContain('Not a valid Filter');
    } else {
      const data = rows(response);
      expect(Array.isArray(data)).toBe(true);
      for (const row of data) {
        if (row.effectiveDate != null) {
          expect(isValidDateScalar(row.effectiveDate)).toBe(true);
          expect(row.effectiveDate > PAST_THRESHOLD).toBe(true);
        }
      }
    }
  });

  // ─── Group 5: Sorting ─────────────────────────────────────────────────────

  test('TC15 - sort by subAccountInternalId ASC returns results in ascending order', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      [],
      new PaginationBuilder().size(20).page(1).sortBy('subAccountInternalId', 'ASC').build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].subAccountInternalId;
      const curr = data[i].subAccountInternalId;
      if (typeof prev === 'number' && typeof curr === 'number') {
        expect(prev).toBeLessThanOrEqual(curr);
      }
    }
  });

  test('TC16 - sort by subAccountInternalId DESC returns results in descending order', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      [],
      new PaginationBuilder().size(20).page(1).sortBy('subAccountInternalId', 'DESC').build(),
    );

    expectSuccess(response);
    const data = rows(response);
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].subAccountInternalId;
      const curr = data[i].subAccountInternalId;
      if (typeof prev === 'number' && typeof curr === 'number') {
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    }
  });

  test('TC17 - sort by a non-existent field returns a GraphQL error', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      [],
      new PaginationBuilder().size(10).page(1).sortBy('nonExistentField', 'ASC').build(),
    );

    expect(response.status).toBe(200);
    expectErrors(response);
    expect(response.body.errors![0].extensions?.code).toBeDefined();
  });

  // ─── Group 6: Config Variations ───────────────────────────────────────────

  test.skip('TC18 - query succeeds with isMaster=true', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      [],
      new PaginationBuilder().size(10).page(1).build(),
      new ConfigBuilder().master(true).build(),
    );

    expectSuccess(response);
  });

  test('TC19 - query succeeds with enableValidDataFilter=true', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      [],
      new PaginationBuilder().size(10).page(1).build(),
      new ConfigBuilder().enableValidDataFilter(true).build(),
    );

    expectSuccess(response);
  });

  test('TC20 - query succeeds with isUserInstitutionFilter=true', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      [],
      new PaginationBuilder().size(10).page(1).build(),
      new ConfigBuilder().userInstitutionFilter(true).build(),
    );

    expectSuccess(response);
  });

  // ─── Group 7: Negative / Null Semantics ───────────────────────────────────

  test('TC21 - malformed filter payload returns a GraphQL error with extensions.code', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList('not-a-valid-filter');

    expect(response.status).toBe(200);
    expectErrors(response);
    expect(response.body.errors![0].extensions?.code).toBeDefined();
  });

  test('TC22 - IS_NULL on countryOfTaxResidence returns only null-valued rows when operator is supported', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('countryOfTaxResidence', 'IS_NULL').build(),
    );

    expect(response.status).toBe(200);

    if (response.body.errors) {
      // IS_NULL not supported by this downstream service — not a failure
      expect(response.body.errors[0].extensions?.code).toBeDefined();
      return;
    }

    const data = rows(response);
    for (const row of data) {
      expect(row.countryOfTaxResidence ?? null).toBeNull();
    }
  });

  test('TC23 - operator "=" with value null differs from IS_NULL semantics on countryOfTaxResidence', { tag: ['@regression'] }, async ({ financeApi }) => {
    const isNullResponse = await financeApi.getBeneficialOwnerWhsList(
      new FilterBuilder().where('countryOfTaxResidence', 'IS_NULL').build(),
    );
    expect(isNullResponse.status).toBe(200);

    if (isNullResponse.body.errors) {
      // IS_NULL not supported — skip comparative assertion
      expect(isNullResponse.body.errors[0].extensions?.code).toBeDefined();
      return;
    }

    const isNullData = rows(isNullResponse);
    const isNullIds = isNullData.map((r) => r.subAccountInternalId);

    const equalNullResponse = await financeApi.getBeneficialOwnerWhsList([
      { field: 'countryOfTaxResidence', operator: '=', value: null },
    ]);
    expect(equalNullResponse.status).toBe(200);

    if (!equalNullResponse.body.errors) {
      const equalNullData = rows(equalNullResponse);
      const equalNullIds = equalNullData.map((r) => r.subAccountInternalId);
      // The two operators should not produce identical result sets
      expect(JSON.stringify(equalNullIds)).not.toEqual(JSON.stringify(isNullIds));
    }
  });
});
