import { test, expect } from '@playwright/test';
import { MAINTENANCE_ROUTES } from '../routes';

test.describe('Maintenance Module — Screen Navigation', () => {
  test.describe('Dashboard', () => {
    test('loads and shows dashboard content', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.dashboard);
      await expect(page.locator('h1')).toContainText(/maintenance|dashboard/i, { timeout: 15_000 });
      // Should not show error state
      await expect(page.locator('text=Failed to load')).toBeHidden();
    });
  });

  test.describe('Asset Register', () => {
    test('loads and shows asset list', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.assets);
      await expect(page.locator('h1')).toContainText(/asset/i, { timeout: 15_000 });
      // Should have search input
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });
  });

  test.describe('Work Requests', () => {
    test('loads work request list', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.workRequests);
      await expect(page.locator('h1')).toContainText(/work request/i, { timeout: 15_000 });
    });

    test('new work request form loads', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.workRequestNew);
      // Should show a form or creation screen
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Work Orders', () => {
    test('loads work order list', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.workOrders);
      await expect(page.locator('h1')).toContainText(/work order/i, { timeout: 15_000 });
      // Should have status filter
      await expect(page.locator('select').first()).toBeVisible();
    });

    test('new work order form loads', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.workOrderNew);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('board view loads', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.workOrderBoard);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('PM Schedules', () => {
    test('loads PM schedule list', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.pmSchedules);
      await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
    });

    test('loads PM calendar', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.pmCalendar);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Breakdowns & Downtime', () => {
    test('loads breakdown list', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.breakdowns);
      await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
    });

    test('loads downtime history', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.downtime);
      await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Contracts', () => {
    test('loads contract list', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.contracts);
      await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('PTW', () => {
    test('loads PTW list', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.ptw);
      await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Shutdown', () => {
    test('loads shutdown list', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.shutdown);
      await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Analytics & Reports', () => {
    test('loads analytics screen', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.analytics);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('loads reliability dashboard', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.reliability);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('loads reports screen', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.reports);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('Configuration', () => {
    test('loads failure codes config', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.configFailureCodes);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('loads strategies config', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.configStrategies);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('loads job plans config', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.configJobPlans);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('loads checklists config', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.configChecklists);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });

    test('loads maintenance config', async ({ page }) => {
      await page.goto(MAINTENANCE_ROUTES.config);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe('No Console Errors', () => {
    test('dashboard has no critical console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
          errors.push(msg.text());
        }
      });

      await page.goto(MAINTENANCE_ROUTES.dashboard);
      await page.waitForTimeout(3000);

      // Filter out known non-critical errors
      const critical = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('net::ERR') && !e.includes('favicon')
      );

      expect(critical).toHaveLength(0);
    });
  });
});
