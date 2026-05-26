import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * Avy ERP — Playwright E2E Test Configuration
 *
 * Run:   pnpm test:e2e              (all tests, headed)
 *        pnpm test:e2e:headless     (all tests, headless — CI)
 *        pnpm test:e2e:api          (API-only tests, no browser needed)
 *        pnpm test:e2e:ui           (Playwright UI mode)
 */
export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './e2e/test-results',

  /* Run tests in files in parallel */
  fullyParallel: false, // sequential within a file (lifecycle tests depend on order)

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt into parallel workers on CI, single worker locally for stability */
  workers: process.env.CI ? 2 : 1,

  /* Reporter */
  reporter: process.env.CI
    ? [['html', { outputFolder: 'e2e/playwright-report' }], ['list']]
    : [['list'], ['html', { outputFolder: 'e2e/playwright-report', open: 'never' }]],

  /* Shared settings for all projects */
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  /* Projects */
  projects: [
    /* Auth setup — runs first, saves storage state */
    {
      name: 'auth-setup',
      testMatch: /auth\/.*setup\.spec\.ts/,
    },

    /* API tests — no browser needed, just HTTP calls */
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: {
        // API tests don't need a browser
        ...devices['Desktop Chrome'],
      },
    },

    /* UI E2E tests — Chromium */
    {
      name: 'chromium',
      testMatch: /maintenance\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/company-admin.json',
      },
    },
  ],

  /* Start local dev server before running tests (E2E_SKIP_SERVER=1|true to disable) */
  webServer: ['1', 'true', 'yes'].includes(
    (process.env.E2E_SKIP_SERVER ?? '').toLowerCase(),
  )
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
