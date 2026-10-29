import { test, expect } from '../../fixtures/base.fixture';
import { expectErrors, expectSuccess, extractData } from '../../helpers/assertions';
import { FilterBuilder, PaginationBuilder } from '../../common/request-builder';
import { logTestResult } from '../helpers';

const OPERATION = 'exportBeneficialOwnerWhs';

type ExportResponse = {
  message?: {
    template?: string | null;
    keys?: Array<{ key?: string | null; value?: string | null }> | null;
  } | null;
};

type BeneficialOwnerWhsRow = {
  institutionId?: number | null;
  subAccountInternalId?: number | null;
};

test.describe('@finance exportBeneficialOwnerWhs', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ─── Group 1: Happy Path & Response Validation ────────────────────────────

  test('TC1 - exportBeneficialOwnerWhs with no filter argument returns a successful response', { tag: ['@smoke'] }, async ({ financeApi }) => {
    const response = await financeApi.exportBeneficialOwnerWhs();

    expectSuccess(response);
    const data = extractData<ExportResponse>(response, OPERATION);
    expect(data).toBeDefined();
  });

  test('TC2 - exportBeneficialOwnerWhs with empty filter [] behaves the same as no filter', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.exportBeneficialOwnerWhs([]);

    expectSuccess(response);
    const data = extractData<ExportResponse>(response, OPERATION);
    expect(data).toBeDefined();
  });

  test('TC3 - response message field has correct ATMessage structure when present', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.exportBeneficialOwnerWhs();

    expectSuccess(response);
    const data = extractData<ExportResponse>(response, OPERATION);
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

  // ─── Group 2: Filtering ───────────────────────────────────────────────────

  test('TC4 - filter by institutionId with = using seeded value — export request accepted', { tag: ['@regression'] }, async ({ financeApi }) => {
    const seed = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(10).page(1).build());
    expectSuccess(seed);
    const seedData = extractData<BeneficialOwnerWhsRow[]>(seed, 'getBeneficialOwnerWhsList');
    const sample = seedData.find((r) => typeof r.institutionId === 'number');
    if (!sample) {
      test.skip(true, 'No BO WHS rows with institutionId available for filter seeding in this environment.');
      return;
    }

    const response = await financeApi.exportBeneficialOwnerWhs(
      new FilterBuilder().where('institutionId', '=', String(sample.institutionId)).build(),
    );

    expectSuccess(response);
    const data = extractData<ExportResponse>(response, OPERATION);
    expect(data).toBeDefined();
  });

  test('TC5 - filter by non-existent institutionId still returns a successful response', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.exportBeneficialOwnerWhs(
      new FilterBuilder().where('institutionId', '=', '999999999').build(),
    );

    expectSuccess(response);
    const data = extractData<ExportResponse>(response, OPERATION);
    expect(data).toBeDefined();
  });

  test('TC6 - combined AND filter on institutionId and subAccountInternalId — export request accepted', { tag: ['@regression'] }, async ({ financeApi }) => {
    const seed = await financeApi.getBeneficialOwnerWhsList([], new PaginationBuilder().size(10).page(1).build());
    expectSuccess(seed);
    const seedData = extractData<BeneficialOwnerWhsRow[]>(seed, 'getBeneficialOwnerWhsList');
    const sample = seedData.find(
      (r) => typeof r.institutionId === 'number' && typeof r.subAccountInternalId === 'number',
    );
    if (!sample) {
      test.skip(true, 'No BO WHS rows with institutionId + subAccountInternalId for combined filter seeding in this environment.');
      return;
    }

    const response = await financeApi.exportBeneficialOwnerWhs(
      new FilterBuilder()
        .where('institutionId', '=', String(sample.institutionId))
        .and('subAccountInternalId', '=', String(sample.subAccountInternalId))
        .build(),
    );

    expectSuccess(response);
    const data = extractData<ExportResponse>(response, OPERATION);
    expect(data).toBeDefined();
  });

  // ─── Group 3: Negative / Invalid Filter ───────────────────────────────────

  test('TC7 - malformed filter payload returns a GraphQL error with extensions.code', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.exportBeneficialOwnerWhs('not-a-valid-filter');

    expect(response.status).toBe(200);
    expectErrors(response);
    expect(response.body.errors![0].extensions?.code).toBeDefined();
  });

  test('TC8 - IS_NULL operator on institutionId is accepted gracefully or returns a structured error', { tag: ['@regression'] }, async ({ financeApi }) => {
    const response = await financeApi.exportBeneficialOwnerWhs(
      new FilterBuilder().where('institutionId', 'IS_NULL').build(),
    );

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
    } else {
      const data = extractData<ExportResponse>(response, OPERATION);
      expect(data).toBeDefined();
    }
  });
});
