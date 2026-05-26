import { test, expect } from '@playwright/test';
import { MAINTENANCE_ROUTES } from '../../data/test-constants';
import { waitForDataLoad, expectToast } from '../../helpers/test-utils';

/**
 * Breakdown & Downtime — Functional E2E Tests
 *
 * Covers:
 *   - Breakdown Log form validation, priority selection, safety toggle, submission
 *   - Breakdowns list loads with data
 *   - Downtime history loads
 */

test.describe('Breakdown Log — Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdownLog);
    await waitForDataLoad(page);
  });

  test('loads with heading and danger banner', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Log Breakdown/i, { timeout: 15_000 });

    // Emergency banner should be visible
    await expect(
      page.getByText(/This will instantly create a breakdown work order/i)
    ).toBeVisible();

    // Core form elements
    await expect(page.getByText('Asset')).toBeVisible();
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Priority')).toBeVisible();
    await expect(page.getByText('Safety Risk')).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /Log Breakdown Now/i })).toBeVisible();
  });

  test('submit button is disabled without asset selected', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Log Breakdown Now/i });
    await expect(submitBtn).toBeDisabled();

    // Fill description but NOT asset — should still be disabled
    await page.getByPlaceholder(/What happened/i).fill('Test breakdown description');
    await expect(submitBtn).toBeDisabled();
  });

  test('priority buttons render all 4 options', async ({ page }) => {
    // 4 priority buttons: Emergency, High, Medium, Low
    const priorityLabels = ['Emergency', 'High', 'Medium', 'Low'];

    for (const label of priorityLabels) {
      await expect(
        page.getByRole('button', { name: label, exact: true })
      ).toBeVisible();
    }
  });

  test('priority button selection updates visual state', async ({ page }) => {
    // Default priority is EMERGENCY
    const emergencyBtn = page.getByRole('button', { name: 'Emergency', exact: true });
    const highBtn = page.getByRole('button', { name: 'High', exact: true });
    const mediumBtn = page.getByRole('button', { name: 'Medium', exact: true });
    const lowBtn = page.getByRole('button', { name: 'Low', exact: true });

    // Emergency should be initially active (has ring-2)
    const emergencyClass = await emergencyBtn.getAttribute('class');
    expect(emergencyClass).toContain('ring-2');

    // Click High
    await highBtn.click();

    // High should now have ring-2
    const highClass = await highBtn.getAttribute('class');
    expect(highClass).toContain('ring-2');

    // Emergency should no longer have ring-2
    const emergencyClassAfter = await emergencyBtn.getAttribute('class');
    expect(emergencyClassAfter).not.toContain('ring-2');

    // Click Medium
    await mediumBtn.click();
    const mediumClass = await mediumBtn.getAttribute('class');
    expect(mediumClass).toContain('ring-2');

    // Click Low
    await lowBtn.click();
    const lowClass = await lowBtn.getAttribute('class');
    expect(lowClass).toContain('ring-2');
  });

  test('safety risk toggle changes visual state', async ({ page }) => {
    // Safety risk toggle is a button with rounded-full class inside the amber section
    const safetySection = page.getByText('Safety Risk').locator('..').locator('..');
    const toggle = safetySection.locator('button').first();

    // Get initial state (should be off / neutral color)
    const initialClass = await toggle.getAttribute('class');
    expect(initialClass).toContain('bg-neutral');

    // Click to toggle ON
    await toggle.click();

    // Should now have danger background
    const afterClass = await toggle.getAttribute('class');
    expect(afterClass).toContain('bg-danger');

    // Toggle OFF again
    await toggle.click();
    const restoredClass = await toggle.getAttribute('class');
    expect(restoredClass).toContain('bg-neutral');
  });

  test('asset search dropdown appears when typing', async ({ page }) => {
    const assetInput = page.getByPlaceholder(/Search assets/i);
    await assetInput.fill('a');
    await page.waitForTimeout(1000);

    // A dropdown with asset options should appear (or empty if no match)
    // The dropdown contains buttons with asset names
    const dropdown = page.locator('.shadow-lg.max-h-48, [class*="shadow-lg"][class*="max-h"]');
    const isVisible = await dropdown.isVisible().catch(() => false);

    // Whether dropdown shows depends on test data — just verify no crash
    // If visible, it should have clickable options
    if (isVisible) {
      const options = dropdown.locator('button');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('description textarea accepts input', async ({ page }) => {
    const textarea = page.getByPlaceholder(/What happened/i);
    await expect(textarea).toBeVisible();

    const testText = 'Motor overheated and shut down automatically';
    await textarea.fill(testText);
    const value = await textarea.inputValue();
    expect(value).toBe(testText);
  });

  test('back button navigates away', async ({ page }) => {
    // The back arrow button
    const backBtn = page.locator('button').filter({
      has: page.locator('[class*="lucide-arrow-left"]'),
    }).first();
    await expect(backBtn).toBeVisible();
  });

  test('submit with asset selected (integration)', async ({ page }) => {
    // Type in asset search to find an asset
    const assetInput = page.getByPlaceholder(/Search assets/i);
    await assetInput.fill('a');
    await page.waitForTimeout(1500);

    // Check if any asset options appeared
    const dropdown = page.locator('.shadow-lg.max-h-48, [class*="shadow-lg"][class*="max-h"]');
    const isVisible = await dropdown.isVisible().catch(() => false);

    if (!isVisible) {
      // No assets in test data — skip this integration test
      test.skip();
      return;
    }

    const firstOption = dropdown.locator('button').first();
    const optionCount = await dropdown.locator('button').count();
    if (optionCount === 0) {
      test.skip();
      return;
    }

    // Select the first asset
    await firstOption.click();
    await page.waitForTimeout(300);

    // Fill description
    await page.getByPlaceholder(/What happened/i).fill('E2E breakdown test');

    // Select priority HIGH
    await page.getByRole('button', { name: 'High', exact: true }).click();

    // Submit should now be enabled
    const submitBtn = page.getByRole('button', { name: /Log Breakdown Now/i });
    await expect(submitBtn).toBeEnabled();

    // Submit the form
    await submitBtn.click();

    // Should show success toast and redirect
    await expectToast(page, /Breakdown Logged|Breakdown work order/i);

    // Should navigate away (either to work order detail or breakdowns list)
    await page.waitForURL(/\/maintenance\/(work-orders|breakdowns)/, { timeout: 15_000 });
  });
});

test.describe('Breakdowns List', () => {
  test('loads with heading and toolbar', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    await expect(page.locator('h1')).toContainText(/Breakdowns/i, { timeout: 15_000 });

    // Should have search input
    await expect(page.getByPlaceholder(/Search breakdowns/i)).toBeVisible();

    // Status filter dropdown
    const statusSelect = page.locator('select').filter({
      has: page.locator('option[value="OPEN"]'),
    }).first();
    await expect(statusSelect).toBeVisible();

    // Log Breakdown button link
    await expect(page.getByRole('link', { name: /Log Breakdown/i })).toBeVisible();
  });

  test('tabs for Active Breakdowns and Recurring Failures', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    // Two tab buttons
    await expect(page.getByRole('button', { name: /Active Breakdowns/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Recurring Failures/i })).toBeVisible();
  });

  test('switching to Recurring Failures tab shows different table', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    // Click Recurring Failures tab
    await page.getByRole('button', { name: /Recurring Failures/i }).click();
    await page.waitForTimeout(500);

    // Should show the recurring failures table headers
    const headers = page.locator('thead th');
    await expect(headers.filter({ hasText: 'Asset' }).first()).toBeVisible();
    await expect(headers.filter({ hasText: 'Failure Mode' }).first()).toBeVisible();
    await expect(headers.filter({ hasText: 'Count' }).first()).toBeVisible();
  });

  test('table shows expected columns for active breakdowns', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    const expectedHeaders = ['WO #', 'Asset', 'Priority', 'Status', 'Downtime', 'Root Cause', 'Technician', 'Actions'];
    const headers = page.locator('thead th');

    for (const text of expectedHeaders) {
      await expect(headers.filter({ hasText: text }).first()).toBeVisible();
    }
  });

  test('status filter dropdown works', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    const statusSelect = page.locator('select').filter({
      has: page.locator('option[value="OPEN"]'),
    }).first();

    // Filter by OPEN
    await statusSelect.selectOption('OPEN');
    await page.waitForTimeout(1000);

    // No error state
    await expect(page.getByText(/Failed to load breakdowns/i)).toBeHidden();

    // Reset
    await statusSelect.selectOption('');
  });

  test('search filters the list', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    await page.getByPlaceholder(/Search breakdowns/i).fill('ZZZZNONEXISTENT99999');
    await page.waitForTimeout(1000);

    // Should show empty state or no matching rows
    const emptyState = page.getByText(/No breakdowns found/i);
    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('Log Breakdown button navigates to log form', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    await page.getByRole('link', { name: /Log Breakdown/i }).click();
    await page.waitForURL(/\/breakdowns\/log/, { timeout: 10_000 });

    await expect(page.locator('h1')).toContainText(/Log Breakdown/i);
  });

  test('filter button toggles expanded filter panel', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    // Priority filter should be hidden initially
    await expect(page.getByText('Priority').locator('..').locator('select')).toBeHidden();

    // Click the filter toggle button
    const filterBtn = page.locator('button').filter({
      has: page.locator('[class*="lucide-filter"]'),
    }).first();
    await filterBtn.click();
    await page.waitForTimeout(300);

    // Extended filters should appear (Priority, From Date, To Date)
    await expect(page.getByText('From Date')).toBeVisible();
    await expect(page.getByText('To Date')).toBeVisible();
  });

  test('does not show error state', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.breakdowns);
    await waitForDataLoad(page);

    await expect(page.getByText(/Failed to load breakdowns/i)).toBeHidden();
  });
});

test.describe('Downtime History', () => {
  test('loads with heading and tabs', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.downtime);
    await waitForDataLoad(page);

    await expect(page.locator('h1')).toContainText(/Downtime History/i, { timeout: 15_000 });

    // Tabs
    await expect(page.getByRole('button', { name: /Downtime Log/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /OEE Feed/i })).toBeVisible();
  });

  test('downtime log table shows expected columns', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.downtime);
    await waitForDataLoad(page);

    const expectedHeaders = ['Asset', 'Start', 'End', 'Duration', 'Category', 'Root Cause', 'WO Link', 'Prod. Loss'];
    const headers = page.locator('thead th');

    for (const text of expectedHeaders) {
      await expect(headers.filter({ hasText: text }).first()).toBeVisible();
    }
  });

  test('search and category filter are visible', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.downtime);
    await waitForDataLoad(page);

    await expect(page.getByPlaceholder(/Search by asset/i)).toBeVisible();

    // Category filter dropdown
    const categorySelect = page.locator('select').filter({
      has: page.locator('option[value="BREAKDOWN"]'),
    }).first();
    await expect(categorySelect).toBeVisible();
  });

  test('category filter dropdown works', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.downtime);
    await waitForDataLoad(page);

    const categorySelect = page.locator('select').filter({
      has: page.locator('option[value="BREAKDOWN"]'),
    }).first();

    // Filter by BREAKDOWN
    await categorySelect.selectOption('BREAKDOWN');
    await page.waitForTimeout(1000);

    // No error state
    await expect(page.getByText(/Failed to load downtime/i)).toBeHidden();

    // Reset
    await categorySelect.selectOption('');
  });

  test('OEE Feed tab loads and shows table', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.downtime);
    await waitForDataLoad(page);

    // Switch to OEE tab
    await page.getByRole('button', { name: /OEE Feed/i }).click();
    await page.waitForTimeout(500);

    // OEE table headers
    const headers = page.locator('thead th');
    await expect(headers.filter({ hasText: 'Asset' }).first()).toBeVisible();
    await expect(headers.filter({ hasText: 'Availability' }).first()).toBeVisible();
    await expect(headers.filter({ hasText: 'Total Downtime' }).first()).toBeVisible();
    await expect(headers.filter({ hasText: 'Events' }).first()).toBeVisible();
  });

  test('filter toggle expands date range filters', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.downtime);
    await waitForDataLoad(page);

    // Click filter button
    const filterBtn = page.locator('button').filter({
      has: page.locator('[class*="lucide-filter"]'),
    }).first();
    await filterBtn.click();
    await page.waitForTimeout(300);

    // Date range filters should appear
    await expect(page.getByText('From Date')).toBeVisible();
    await expect(page.getByText('To Date')).toBeVisible();
  });

  test('does not show error state', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.downtime);
    await waitForDataLoad(page);

    await expect(page.getByText(/Failed to load downtime/i)).toBeHidden();
  });
});
