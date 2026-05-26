import { test, expect } from '@playwright/test';
import { WorkOrderListPage, WorkOrderDetailPage } from '../pages';

test.describe('Work Order Lifecycle — UI E2E', () => {
  let woListPage: WorkOrderListPage;

  test.beforeEach(async ({ page }) => {
    woListPage = new WorkOrderListPage(page);
  });

  test('work order list screen loads with data', async ({ page }) => {
    await woListPage.goto();
    await woListPage.expectLoaded();
    // Should show at least the table headers
    await expect(page.locator('thead')).toBeVisible();
  });

  test('status filter works', async ({ page }) => {
    await woListPage.goto();
    await woListPage.expectLoaded();

    // Filter by DRAFT
    await woListPage.filterByStatus('DRAFT');
    await page.waitForTimeout(1000);
    // All visible status badges should say DRAFT
    const badges = page.locator('tbody [class*="badge"], tbody [class*="Badge"]');
    const count = await badges.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await badges.nth(i).innerText();
      expect(text.toUpperCase()).toContain('DRAFT');
    }
  });

  test('search filter works', async ({ page }) => {
    await woListPage.goto();
    await woListPage.expectLoaded();

    // Search for something that shouldn't exist
    await woListPage.search('ZZZZNONEXISTENT99999');
    await page.waitForTimeout(1000);

    // Should show empty state or 0 rows
    const rowCount = await page.locator('tbody tr').count();
    // Either no rows or an empty state message
    if (rowCount > 0) {
      await expect(page.locator('tbody tr').first().locator('text=No work orders')).toBeVisible();
    }
  });

  test('clicking View navigates to detail page', async ({ page }) => {
    await woListPage.goto();
    await woListPage.expectLoaded();

    const emptyState = page.getByText(/no work orders found/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    // Click view on first row
    await woListPage.viewRow(0);
    await page.waitForURL(/\/work-orders\//, { timeout: 10_000 });

    // Should show work order detail
    const detailPage = new WorkOrderDetailPage(page);
    await detailPage.expectLoaded();
  });

  test('work order detail shows correct tabs', async ({ page }) => {
    await woListPage.goto();
    const emptyState = page.getByText(/no work orders found/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await woListPage.viewRow(0);
    await page.waitForURL(/\/work-orders\//);

    const detailPage = new WorkOrderDetailPage(page);
    await detailPage.expectLoaded();

    // All tabs should be present
    for (const tab of ['Overview', 'Checklist', 'Parts', 'Labour', 'Evidence', 'Cost', 'History']) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible();
    }
  });

  test('work order detail tabs switch content', async ({ page }) => {
    await woListPage.goto();
    const emptyState = page.getByText(/no work orders found/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await woListPage.viewRow(0);
    await page.waitForURL(/\/work-orders\//);
    const detailPage = new WorkOrderDetailPage(page);

    // Switch to Cost tab
    await detailPage.switchTab('Cost');
    await expect(page.getByText(/cost summary/i)).toBeVisible({ timeout: 5_000 });

    // Switch to History tab
    await detailPage.switchTab('History');
    // Should show history or empty state
    await page.waitForTimeout(500);

    // Switch back to Overview
    await detailPage.switchTab('Overview');
    await expect(page.getByText(/description|scheduling/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('DRAFT work order shows Approve button', async ({ page }) => {
    await woListPage.goto();
    await woListPage.filterByStatus('DRAFT');
    await page.waitForTimeout(1000);

    // Check for empty state — the empty row contains "No work orders found"
    const emptyState = page.getByText(/no work orders found/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await woListPage.viewRow(0);
    await page.waitForURL(/\/work-orders\//);
    const detailPage = new WorkOrderDetailPage(page);

    await expect(detailPage.approveButton).toBeVisible();
    await expect(detailPage.startButton).toBeHidden();
    await expect(detailPage.completeButton).toBeHidden();
    await expect(detailPage.closeButton).toBeHidden();
  });

  test('APPROVED work order shows Assign button', async ({ page }) => {
    await woListPage.goto();
    await woListPage.filterByStatus('APPROVED');
    await page.waitForTimeout(1000);

    const emptyState = page.getByText(/no work orders found/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await woListPage.viewRow(0);
    await page.waitForURL(/\/work-orders\//);
    const detailPage = new WorkOrderDetailPage(page);

    await expect(detailPage.assignButton).toBeVisible();
    await expect(detailPage.approveButton).toBeHidden();
  });

  test('IN_PROGRESS work order shows Hold and Complete buttons', async ({ page }) => {
    await woListPage.goto();
    await woListPage.filterByStatus('IN_PROGRESS');
    await page.waitForTimeout(1000);

    const emptyState = page.getByText(/no work orders found/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await woListPage.viewRow(0);
    await page.waitForURL(/\/work-orders\//);
    const detailPage = new WorkOrderDetailPage(page);

    await expect(detailPage.holdButton).toBeVisible();
    await expect(detailPage.completeButton).toBeVisible();
  });

  test('board view loads and shows columns', async ({ page }) => {
    await page.goto('/app/maintenance/work-orders/board');
    await page.waitForTimeout(2000);
    // Board should have status columns
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });
});
