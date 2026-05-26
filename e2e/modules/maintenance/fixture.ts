import { test as base, expect } from '@playwright/test';
import { MaintenanceApiClient } from './api.client';

const TEST_EMAIL = process.env.E2E_USER_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || 'Test@123';

/**
 * Maintenance module test fixture.
 * Provides a MaintenanceApiClient (worker-scoped, logs in once).
 *
 * Usage in tests:
 *   import { test, expect } from '../../modules/maintenance/fixture';
 *   test('my test', async ({ api }) => { ... });
 */
export const test = base.extend<object, { api: MaintenanceApiClient }>({
  api: [async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: process.env.E2E_API_URL || 'http://localhost:3030/api/v1',
    });
    const client = new MaintenanceApiClient(ctx);
    await client.login(TEST_EMAIL, TEST_PASSWORD);
    await use(client);
    await ctx.dispose();
  }, { scope: 'worker' }],
});

export { expect };
