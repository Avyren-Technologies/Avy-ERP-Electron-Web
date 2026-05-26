import { test as base, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import { BaseApiClient } from '../helpers/base-api-client';

const TEST_EMAIL = process.env.E2E_USER_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || 'Test@123';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const STORAGE_STATE_PATH = path.join(__dirname, '../.auth/company-admin.json');

/**
 * Base test fixture — logs in ONCE per worker.
 * Provides a BaseApiClient. Module tests can extend this further.
 */
export const test = base.extend<object, { workerApi: BaseApiClient }>({
  workerApi: [async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: process.env.E2E_API_URL || 'http://localhost:3030/api/v1',
    });
    const api = new BaseApiClient(ctx);
    await api.login(TEST_EMAIL, TEST_PASSWORD);
    await use(api);
    await ctx.dispose();
  }, { scope: 'worker' }],
});

export { expect };
