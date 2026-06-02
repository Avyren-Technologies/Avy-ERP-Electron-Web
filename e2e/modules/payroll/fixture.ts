import { test as base, expect } from '@playwright/test';
import { PayrollApiClient } from './api.client';

const TEST_EMAIL = process.env.E2E_USER_EMAIL || 'admin-mpb7qbnsz7e1@test.local';
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || 'Test@12345';

/**
 * Payroll module test fixture.
 * Provides a PayrollApiClient (worker-scoped, logs in once).
 *
 * Usage in tests:
 *   import { test, expect } from '../../modules/payroll/fixture';
 *   test('my test', async ({ api }) => { ... });
 */
export const test = base.extend<object, { api: PayrollApiClient }>({
  api: [async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: process.env.E2E_API_URL || 'http://localhost:3030/api/v1',
    });
    const client = new PayrollApiClient(ctx);
    await client.login(TEST_EMAIL, TEST_PASSWORD);
    await use(client);
    await ctx.dispose();
  }, { scope: 'worker' }],
});

export { expect };
