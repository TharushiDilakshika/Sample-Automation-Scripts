import { test, expect } from '../../fixtures/base.fixture';
import { expectSuccess, expectErrors } from '../../helpers/assertions';
import { logTestResult } from '../helpers';

const OPERATION = 'getCustomerSellRate';

test.describe('@corporate-actions getCustomerSellRate', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ── Group 1: Happy Path ─────────────────────────────────────────────────────

  test('TC1 - Verify that a valid fromCurrency and toCurrency returns a numeric sell rate',
    { tag: ['@smoke'] },
    async ({ corporateActionsApi, envData }) => {
      const req = envData.corpAction?.sellRateRequest;
      test.skip(
        !req?.fromCurrency || req.fromCurrency.startsWith('FILL_IN'),
        'sellRateRequest not configured for this environment',
      );

      const request = { fromCurrency: req!.fromCurrency, toCurrency: req!.toCurrency };
      const response = await corporateActionsApi.getCustomerSellRate(request);
      expectSuccess(response);
      const rate = (response.body.data as Record<string, unknown>)?.[OPERATION];
      expect(typeof rate).toBe('number');
      expect(isFinite(rate as number)).toBe(true);
    },
  );

  test('TC2 - Verify that a valid request with an optional date returns a numeric sell rate',
    { tag: ['@regression'] },
    async ({ corporateActionsApi, envData }) => {
      const req = envData.corpAction?.sellRateRequest;
      test.skip(
        !req?.fromCurrency || req.fromCurrency.startsWith('FILL_IN'),
        'sellRateRequest not configured for this environment',
      );

      const request = {
        fromCurrency: req!.fromCurrency,
        toCurrency: req!.toCurrency,
        date: '2025-01-01 00:00:00',
      };
      const response = await corporateActionsApi.getCustomerSellRate(request);
      expectSuccess(response);
      const rate = (response.body.data as Record<string, unknown>)?.[OPERATION];
      expect(typeof rate).toBe('number');
      expect(isFinite(rate as number)).toBe(true);
    },
  );

  // ── Group 2: Date Argument Variations ──────────────────────────────────────

  test('TC3 - Verify that omitting the optional date field still returns a numeric sell rate',
    { tag: ['@regression'] },
    async ({ corporateActionsApi, envData }) => {
      const req = envData.corpAction?.sellRateRequest;
      test.skip(
        !req?.fromCurrency || req.fromCurrency.startsWith('FILL_IN'),
        'sellRateRequest not configured for this environment',
      );

      const request = { fromCurrency: req!.fromCurrency, toCurrency: req!.toCurrency };
      const response = await corporateActionsApi.getCustomerSellRate(request);
      expectSuccess(response);
      const rate = (response.body.data as Record<string, unknown>)?.[OPERATION];
      expect(typeof rate).toBe('number');
    },
  );

  // ── Group 3: Negative / Error Handling ─────────────────────────────────────

  test('TC4 - Verify that an invalid fromCurrency returns an error',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      const request = { fromCurrency: 'INVALID_CCY', toCurrency: 'USD' };
      const response = await corporateActionsApi.getCustomerSellRate(request);
      expectErrors(response);
      const error = response.body.errors![0];
      expect(error.extensions).toHaveProperty('code');
    },
  );

  test('TC5 - Verify that an invalid toCurrency returns an error',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      const request = { fromCurrency: 'USD', toCurrency: 'INVALID_CCY' };
      const response = await corporateActionsApi.getCustomerSellRate(request);
      expectErrors(response);
      const error = response.body.errors![0];
      expect(error.extensions).toHaveProperty('code');
    },
  );

  test('TC6 - Verify that omitting the required request argument returns a GRAPHQL_VALIDATION_FAILED error',
    { tag: ['@regression'] },
    async ({ corporateActionsApi }) => {
      const response = await corporateActionsApi.getCustomerSellRate(undefined);
      expectErrors(response);
      const error = response.body.errors![0];
      expect(error.extensions).toHaveProperty('code');
    },
  );
});
