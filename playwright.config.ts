import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * Avy ERP — Playwright E2E Test Configuration (Module-Based)
 *
 * Structure:
 *   e2e/shared/         — Auth fixtures, base API client, test utils, base POM
 *   e2e/modules/<mod>/  — Per-module API client, routes, pages, tests
 *   e2e/tests/auth/     — Auth setup (runs first)
 *
 * Run commands:
 *   pnpm test:e2e                      — all modules, headed
 *   pnpm test:e2e:headless             — all modules, headless (CI)
 *   pnpm test:e2e:ui                   — Playwright UI mode
 *   pnpm test:e2e:maintenance          — maintenance module only
 *   pnpm test:e2e:maintenance:api      — maintenance API tests only
 *   pnpm test:e2e:<module>             — any module by name
 */
export default defineConfig({
  /* Test discovery: scan both auth setup AND all module test dirs */
  testDir: './e2e',
  testMatch: [
    'tests/auth/**/*.spec.ts',
    'modules/*/tests/**/*.spec.ts',
  ],
  outputDir: './e2e/test-results',

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,

  reporter: process.env.CI
    ? [['html', { outputFolder: 'e2e/playwright-report' }], ['list']]
    : [['list'], ['html', { outputFolder: 'e2e/playwright-report', open: 'never' }]],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    /* ── Auth setup — runs first, saves browser storage state ── */
    {
      name: 'auth-setup',
      testMatch: /tests\/auth\/.*setup\.spec\.ts/,
    },

    /* ── API tests (all modules) — no browser needed ── */
    {
      name: 'api',
      testMatch: /modules\/.*\/tests\/api\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* ── Maintenance module — API only ── */
    {
      name: 'maintenance:api',
      testMatch: /modules\/maintenance\/tests\/api\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* ── Maintenance module — UI tests ── */
    {
      name: 'maintenance',
      testMatch: /modules\/maintenance\/tests\/(?!api\.).*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/company-admin.json',
      },
    },

    /* ── Inventory module — API only ── */
    {
      name: 'inventory:api',
      testMatch: /modules\/inventory\/tests\/api\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* ── Inventory module — UI tests ── */
    {
      name: 'inventory',
      testMatch: /modules\/inventory\/tests\/(?!api\.).*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/company-admin.json',
      },
    },

    /* ──────────────────────────────────────────────────────────
     * ADD NEW MODULES HERE — copy the maintenance pattern:
     *
     * {
     *   name: 'hrms:api',
     *   testMatch: /modules\/hrms\/tests\/api\.spec\.ts/,
     *   use: { ...devices['Desktop Chrome'] },
     * },
     * {
     *   name: 'hrms',
     *   testMatch: /modules\/hrms\/tests\/(?!api\.).*\.spec\.ts/,
     *   dependencies: ['auth-setup'],
     *   use: {
     *     ...devices['Desktop Chrome'],
     *     storageState: 'e2e/.auth/company-admin.json',
     *   },
     * },
     * ────────────────────────────────────────────────────────── */

    /* ── All UI tests (for full suite runs) ── */
    {
      name: 'all-ui',
      testMatch: /modules\/.*\/tests\/(?!api\.).*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/company-admin.json',
      },
    },
  ],

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
