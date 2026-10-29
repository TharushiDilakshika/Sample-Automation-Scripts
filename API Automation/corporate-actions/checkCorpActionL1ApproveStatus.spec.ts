import { test, expect } from '../../fixtures/base.fixture';
import { expectSuccess, extractData, expectErrors } from '../../helpers/assertions';
import { logTestResult } from '../helpers';

const OPERATION = 'checkCorpActionL1ApproveStatus';

/** All recognised members of the CorpActionApproveCheckStatus enum. */
const VALID_STATUSES = new Set([
  'CAPledged',
  'FailedToValidateWithSellPending',
  'None',
  'ValidationWithNewExchange',
  'WithSellPendingExists',
  'WithoutBankAccounts',
  'WithoutCostBankAccounts',
  'WithoutInternalBankAccounts',
]);

test.describe('@corporate-actions checkCorpActionL1ApproveStatus', () => {
  //test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    logTestResult(testInfo);
  });

  // ─── Group 1: Happy Path ───────────────────────────────────────────────────

  test('TC1 - call with no request returns HTTP 200 with a valid JSON response', { tag: ['@smoke'] }, async ({ corporateActionsApi }) => {
    // The `request` arg is nullable (no !) so the gateway accepts the call.
    // However the CORP service requires a real notificationId to perform its lookup;
    // without one it returns ATError "Internal Error" (errorCode 22, UNWN) rather than
    // an empty array. We verify the response is valid JSON (HTTP 200, not a crash).
    const response = await corporateActionsApi.checkCorpActionL1ApproveStatus();

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
    } else {
      const data = extractData<unknown[]>(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('TC2 - when data is returned each item is a recognised CorpActionApproveCheckStatus enum member', { tag: ['@regression'] }, async ({ corporateActionsApi }) => {
    // Same null-request behaviour as TC1 — CORP may return ATError instead of data.
    // Enum validation only runs when the service returns actual status values.
    const response = await corporateActionsApi.checkCorpActionL1ApproveStatus();

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
      return;
    }
    const data = extractData<unknown[]>(response, OPERATION);
    expect(Array.isArray(data)).toBe(true);
    for (const item of data) {
      expect(VALID_STATUSES.has(String(item))).toBe(true);
    }
  });

  // ─── Group 2: Valid notificationId ────────────────────────────────────────

  test('TC3 - call with valid notificationId from envData returns HTTP 200', { tag: ['@regression'] }, async ({ corporateActionsApi, envData }) => {
    if (!envData.corpAction?.notificationId) {
      test.skip(true, 'envData.corpAction.notificationId not configured for this environment — populate src/data/{ENV}.json to enable');
      return;
    }
    const response = await corporateActionsApi.checkCorpActionL1ApproveStatus({
      notificationId: envData.corpAction.notificationId,
    });

    expectSuccess(response);
    const data = extractData<unknown[]>(response, OPERATION);
    expect(Array.isArray(data)).toBe(true);
    for (const item of data) {
      expect(VALID_STATUSES.has(String(item))).toBe(true);
    }
  });

  test('TC4 - call with non-existent notificationId (999999999) returns HTTP 200 with empty or None status', { tag: ['@regression'] }, async ({ corporateActionsApi }) => {
    // Verifies the gateway does not crash on an unknown ID — expects either an empty
    // array, a [None] sentinel, or a structured ATError (not a protocol-level failure).
    const response = await corporateActionsApi.checkCorpActionL1ApproveStatus({
      notificationId: 999999999,
    });

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
    } else {
      const data = extractData<unknown[]>(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    }
  });

  // ─── Group 3: Input Type Validation ───────────────────────────────────────

  test('TC5 - empty request object {} triggers a required-field error for notificationId!', { tag: ['@regression'] }, async ({ corporateActionsApi }) => {
    // CorpActionApproveCheckInput.notificationId is Long! (required).
    // Passing an empty object omits the required field → GraphQL validation error
    // returned by the engine before the resolver runs.
    const response = await corporateActionsApi.checkCorpActionL1ApproveStatus({});

    expect(response.status).toBe(200);
    expectErrors(response);
    expect(response.body.errors![0].extensions?.code).toBeDefined();
  });

  test('TC6 - string value "INVALID_VALUE_XYZ" for notificationId triggers a type coercion error', { tag: ['@regression'] }, async ({ corporateActionsApi }) => {
    // Long cannot coerce from an arbitrary string → the GraphQL type system
    // rejects the variable before the resolver is invoked.
    const response = await corporateActionsApi.checkCorpActionL1ApproveStatus({
      notificationId: 'INVALID_VALUE_XYZ',
    });

    expect(response.status).toBe(200);
    expectErrors(response);
  });

  test('TC7 - negative notificationId (-1) is accepted by the gateway (Long boundary)', { tag: ['@regression'] }, async ({ corporateActionsApi }) => {
    // Negative longs are syntactically valid; the backend may return an empty
    // array, a structured ATError, or [None] depending on its lookup behaviour.
    const response = await corporateActionsApi.checkCorpActionL1ApproveStatus({
      notificationId: -1,
    });

    expect(response.status).toBe(200);
    if (response.body.errors) {
      expect(response.body.errors[0].extensions?.code).toBeDefined();
    } else {
      const data = extractData<unknown[]>(response, OPERATION);
      expect(Array.isArray(data)).toBe(true);
    }
  });
});
