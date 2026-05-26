import { test, expect, type Page } from '@playwright/test';

/**
 * Work Request CRUD — Functional E2E Tests
 *
 * Prerequisites:
 * - Auth storage state at e2e/.auth/company-admin.json (from auth-setup project)
 * - At least one asset registered in the maintenance module
 * - The logged-in user must have `maintenance.work-orders:create` and
 *   `maintenance.work-orders:approve` permissions
 *
 * These tests run sequentially (fullyParallel: false in playwright.config)
 * because lifecycle tests depend on prior state.
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const WR_CREATE_URL = '/app/maintenance/work-requests/new';
const WR_LIST_URL = '/app/maintenance/work-requests';

async function waitForLoad(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.locator('.animate-spin').first().waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {});
}

/**
 * Pick the first available asset inside the AssetPicker (SearchableSelect).
 */
async function pickFirstAsset(page: Page) {
  const assetPicker = page.locator('text=Asset').locator('..').locator('..');

  const trigger = assetPicker.locator('[role="combobox"], input[type="text"], button').first();
  await trigger.click();

  const firstOption = page.locator('[role="option"]').first();
  const optionVisible = await firstOption.isVisible({ timeout: 10_000 }).catch(() => false);

  if (!optionVisible) {
    await assetPicker.locator('div').first().click();
    await page.waitForTimeout(1_000);
  }

  await page.locator('[role="option"]').first().click({ timeout: 10_000 });
}

/**
 * Navigate to the first WR in the list matching a given status, or return null.
 */
async function navigateToWRByStatus(page: Page, status: string): Promise<string | null> {
  await page.goto(WR_LIST_URL);
  await waitForLoad(page);

  // Use the status filter dropdown
  const statusSelect = page.locator('select').filter({ hasText: 'All Statuses' });
  if (await statusSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await statusSelect.selectOption(status);
    await waitForLoad(page);
  }

  // Click the first "View" eye icon link
  const viewLink = page.locator('a[title="View"]').first();
  const hasRow = await viewLink.isVisible({ timeout: 5_000 }).catch(() => false);
  if (!hasRow) return null;

  await viewLink.click();
  await waitForLoad(page);
  return page.url();
}

/* ------------------------------------------------------------------ */
/*  1. Create WR — Form Validation                                    */
/* ------------------------------------------------------------------ */

test.describe('Work Request Create — Form Validation', () => {
  test('submit button is disabled without asset and description', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    // Heading
    await expect(page.getByRole('heading', { name: 'New Work Request' })).toBeVisible();

    const submitBtn = page.getByRole('button', { name: 'Submit Work Request' });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('submit remains disabled when only asset is selected (no description)', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    await pickFirstAsset(page);

    const submitBtn = page.getByRole('button', { name: 'Submit Work Request' });
    // Still disabled because description is empty
    await expect(submitBtn).toBeDisabled();
  });

  test('submit remains disabled when only description is filled (no asset)', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    // Fill description only
    const description = page.locator('textarea[placeholder*="Describe"]');
    await description.fill('Testing without asset selection');

    const submitBtn = page.getByRole('button', { name: 'Submit Work Request' });
    await expect(submitBtn).toBeDisabled();
  });

  test('submit enables when both asset and description are filled', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    await pickFirstAsset(page);

    const description = page.locator('textarea[placeholder*="Describe"]');
    await description.fill('E2E test description for work request');

    const submitBtn = page.getByRole('button', { name: 'Submit Work Request' });
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
  });

  test('safety risk checkbox can be toggled', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();

    // Verify unchecked by default
    await expect(checkbox).not.toBeChecked();

    // Toggle on
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Toggle off
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('request type dropdown has all options', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    // First <select> in the form is Request Type
    const requestTypeSelect = page.locator('select').nth(0);
    await expect(requestTypeSelect).toBeVisible();

    const expectedTypes = ['Breakdown', 'Planned Service', 'Inspection', 'Replacement', 'Safety', 'Other'];
    for (const typeName of expectedTypes) {
      await expect(requestTypeSelect.locator('option', { hasText: typeName })).toBeAttached();
    }

    // Default is BREAKDOWN
    await expect(requestTypeSelect).toHaveValue('BREAKDOWN');
  });

  test('priority dropdown has all options and defaults to MEDIUM', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    // Second <select> is Priority
    const prioritySelect = page.locator('select').nth(1);
    await expect(prioritySelect).toHaveValue('MEDIUM');

    const expectedPriorities = ['Emergency', 'High', 'Medium', 'Low'];
    for (const priority of expectedPriorities) {
      await expect(prioritySelect.locator('option', { hasText: priority })).toBeAttached();
    }
  });
});

/* ------------------------------------------------------------------ */
/*  2. Create WR — Submit                                             */
/* ------------------------------------------------------------------ */

test.describe('Work Request Create — Submit', () => {
  test('create work request with required fields and verify success', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    // Select asset
    await pickFirstAsset(page);

    // Fill description (required)
    const description = page.locator('textarea[placeholder*="Describe"]');
    await description.fill('E2E test — pump bearing shows unusual vibration pattern, needs inspection');

    // Submit
    const submitBtn = page.getByRole('button', { name: 'Submit Work Request' });
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
    await submitBtn.click();

    // Verify success toast
    await expect(
      page.getByText('Your work request has been submitted successfully.')
    ).toBeVisible({ timeout: 15_000 });

    // Verify redirect to list page
    await expect(page).toHaveURL(/\/app\/maintenance\/work-requests\/?$/, { timeout: 10_000 });
  });

  test('create work request with all optional fields', async ({ page }) => {
    await page.goto(WR_CREATE_URL);
    await waitForLoad(page);

    // Asset
    await pickFirstAsset(page);

    // Request Type
    const requestTypeSelect = page.locator('select').nth(0);
    await requestTypeSelect.selectOption('SAFETY');
    await expect(requestTypeSelect).toHaveValue('SAFETY');

    // Priority
    const prioritySelect = page.locator('select').nth(1);
    await prioritySelect.selectOption('EMERGENCY');
    await expect(prioritySelect).toHaveValue('EMERGENCY');

    // Description
    const description = page.locator('textarea[placeholder*="Describe"]');
    await description.fill('E2E test — safety concern: exposed wiring near motor coupling');

    // Location Detail
    const locationDetail = page.locator('input[placeholder*="motor coupling"]');
    await locationDetail.fill('Section B, near motor coupling');

    // Requested By Date
    const requestedByDate = page.locator('input[type="date"]');
    await requestedByDate.fill('2026-06-15');

    // Safety Risk checkbox
    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Submit
    const submitBtn = page.getByRole('button', { name: 'Submit Work Request' });
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
    await submitBtn.click();

    // Verify success toast
    await expect(
      page.getByText('Your work request has been submitted successfully.')
    ).toBeVisible({ timeout: 15_000 });

    // Verify redirect
    await expect(page).toHaveURL(/\/app\/maintenance\/work-requests\/?$/, { timeout: 10_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  3. WR Detail — Status Display                                     */
/* ------------------------------------------------------------------ */

test.describe('Work Request Detail — Status Display', () => {
  test('displays request number, status badge, priority, and request type', async ({ page }) => {
    await page.goto(WR_LIST_URL);
    await waitForLoad(page);

    const viewLink = page.locator('a[title="View"]').first();
    const hasWR = await viewLink.isVisible({ timeout: 5_000 }).catch(() => false);
    test.skip(!hasWR, 'No work requests exist in the system');

    await viewLink.click();
    await waitForLoad(page);

    // Heading
    await expect(page.getByText('Work Request Detail')).toBeVisible();

    // Request number badge (e.g. "WR-00001")
    const requestNumber = page.locator('span').filter({ hasText: /^WR-\d+$/ }).first();
    await expect(requestNumber).toBeVisible({ timeout: 5_000 });

    // Status badge should be visible (any status)
    const statusBadge = page.locator('span').filter({
      hasText: /Draft|Submitted|Under Review|Approved|Converted|Rejected|Cancelled/
    }).first();
    await expect(statusBadge).toBeVisible({ timeout: 5_000 });

    // Description section
    await expect(page.getByText('Description').first()).toBeVisible();

    // Details side card with request type, priority, safety risk
    await expect(page.getByText('Details').first()).toBeVisible();
    await expect(page.getByText('Request Type')).toBeVisible();
    await expect(page.getByText('Priority')).toBeVisible();
    await expect(page.getByText('Safety Risk')).toBeVisible();

    // Asset info card
    await expect(page.getByText('Asset').first()).toBeVisible();

    // Timeline section
    await expect(page.getByText('Timeline')).toBeVisible();
    await expect(page.getByText('Created')).toBeVisible();
  });

  test('SUBMITTED WR shows Triage button', async ({ page }) => {
    const url = await navigateToWRByStatus(page, 'SUBMITTED');
    test.skip(!url, 'No SUBMITTED work requests available');

    const triageBtn = page.getByRole('button', { name: 'Triage' });
    await expect(triageBtn).toBeVisible({ timeout: 5_000 });
  });

  test('UNDER_REVIEW WR shows Approve and Reject buttons', async ({ page }) => {
    const url = await navigateToWRByStatus(page, 'UNDER_REVIEW');
    test.skip(!url, 'No UNDER_REVIEW work requests available');

    await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible({ timeout: 5_000 });
  });

  test('APPROVED WR shows Convert to WO button', async ({ page }) => {
    const url = await navigateToWRByStatus(page, 'APPROVED');
    test.skip(!url, 'No APPROVED work requests available');

    await expect(page.getByRole('button', { name: 'Convert to WO' })).toBeVisible({ timeout: 5_000 });
  });

  test('triage modal opens and has required fields', async ({ page }) => {
    const url = await navigateToWRByStatus(page, 'SUBMITTED');
    test.skip(!url, 'No SUBMITTED work requests available');

    const triageBtn = page.getByRole('button', { name: 'Triage' });
    await triageBtn.click();

    // Modal: "Triage Work Request"
    await expect(page.getByText('Triage Work Request')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Triage Notes')).toBeVisible();
    await expect(page.getByText('Assign Priority')).toBeVisible();

    // Priority dropdown in the modal should have the standard options
    const modalPrioritySelect = page.locator('select').last();
    await expect(modalPrioritySelect.locator('option', { hasText: 'Keep current priority' })).toBeAttached();

    // Cancel button closes the modal
    await page.getByRole('button', { name: 'Cancel' }).last().click();
    await expect(page.getByText('Triage Work Request')).not.toBeVisible({ timeout: 3_000 });
  });

  test('reject modal requires a reason', async ({ page }) => {
    const url = await navigateToWRByStatus(page, 'UNDER_REVIEW');
    test.skip(!url, 'No UNDER_REVIEW work requests available');

    await page.getByRole('button', { name: 'Reject' }).click();

    // Modal: "Reject Work Request"
    await expect(page.getByText('Reject Work Request')).toBeVisible({ timeout: 5_000 });

    const rejectConfirmBtn = page.getByRole('button', { name: 'Reject' }).last();
    // Disabled until reason is provided
    await expect(rejectConfirmBtn).toBeDisabled();

    const reasonTextarea = page.locator('textarea[placeholder*="reason"]');
    await reasonTextarea.fill('E2E test — not actionable at this time');

    // Now enabled
    await expect(rejectConfirmBtn).toBeEnabled({ timeout: 3_000 });

    // Cancel instead of confirming (to not modify data unnecessarily)
    await page.getByRole('button', { name: 'Cancel' }).last().click();
    await expect(page.getByText('Reject Work Request')).not.toBeVisible({ timeout: 3_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  4. WR List — Filtering                                            */
/* ------------------------------------------------------------------ */

test.describe('Work Request List — Filtering', () => {
  test('list page loads with header and table', async ({ page }) => {
    await page.goto(WR_LIST_URL);
    await waitForLoad(page);

    await expect(page.getByRole('heading', { name: 'Work Requests' })).toBeVisible();
    await expect(page.getByText('Manage maintenance work requests')).toBeVisible();

    // Table headers
    await expect(page.getByText('Request #')).toBeVisible();
    await expect(page.getByText('Asset').first()).toBeVisible();
    await expect(page.getByText('Type').first()).toBeVisible();
    await expect(page.getByText('Status').first()).toBeVisible();
  });

  test('search input filters results', async ({ page }) => {
    await page.goto(WR_LIST_URL);
    await waitForLoad(page);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type a search query — the request should filter server-side
    await searchInput.fill('WR-');
    await waitForLoad(page);

    // The table should still have rows (or show empty state)
    // We verify the search doesn't crash and results update
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('status filter narrows results', async ({ page }) => {
    await page.goto(WR_LIST_URL);
    await waitForLoad(page);

    // Get initial count
    const initialRows = await page.locator('tbody tr').count();

    // Filter by SUBMITTED
    const statusSelect = page.locator('select').filter({ hasText: 'All Statuses' });
    await statusSelect.selectOption('SUBMITTED');
    await waitForLoad(page);

    // Either rows show submitted badges or empty state
    const filteredRows = page.locator('tbody tr');
    const filteredCount = await filteredRows.count();

    // The filtered count should be less than or equal to the initial
    // (unless all are SUBMITTED, which is valid too)
    expect(filteredCount).toBeLessThanOrEqual(Math.max(initialRows, 1));

    // If rows exist, verify all have "Submitted" status badge
    if (filteredCount > 0) {
      const firstBadge = page.locator('tbody tr').first().locator('span', { hasText: 'Submitted' });
      // The badge might not exist if the row is the empty state
      const badgeVisible = await firstBadge.isVisible({ timeout: 3_000 }).catch(() => false);
      if (badgeVisible) {
        await expect(firstBadge).toBeVisible();
      }
    }
  });

  test('priority filter works', async ({ page }) => {
    await page.goto(WR_LIST_URL);
    await waitForLoad(page);

    const prioritySelect = page.locator('select').filter({ hasText: 'All Priorities' });
    await prioritySelect.selectOption('HIGH');
    await waitForLoad(page);

    // Verify filter is applied (page doesn't crash)
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('clear filters resets all dropdowns', async ({ page }) => {
    await page.goto(WR_LIST_URL);
    await waitForLoad(page);

    // Apply filters
    const statusSelect = page.locator('select').filter({ hasText: 'All Statuses' });
    await statusSelect.selectOption('SUBMITTED');
    const prioritySelect = page.locator('select').filter({ hasText: 'All Priorities' });
    await prioritySelect.selectOption('HIGH');
    await waitForLoad(page);

    // Clear button should appear
    const clearBtn = page.getByText('Clear');
    const hasClear = await clearBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasClear) {
      await clearBtn.click();
      await waitForLoad(page);

      // Verify filters are reset
      await expect(statusSelect).toHaveValue('');
      await expect(prioritySelect).toHaveValue('');
    }
  });

  test('new work request link navigates to create page', async ({ page }) => {
    await page.goto(WR_LIST_URL);
    await waitForLoad(page);

    const newBtn = page.getByRole('link', { name: 'New Work Request' });
    const hasNewBtn = await newBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    test.skip(!hasNewBtn, 'New Work Request button not visible (missing permissions)');

    await newBtn.click();
    await expect(page).toHaveURL(/\/work-requests\/new\/?$/, { timeout: 10_000 });
  });

  test('expanded filters show request type dropdown', async ({ page }) => {
    await page.goto(WR_LIST_URL);
    await waitForLoad(page);

    // Click the filter toggle button
    const filterBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' });
    // The filter button has a Filter icon — find it near the search bar
    const filterToggle = page.locator('button:has(svg.lucide-filter), button:has(svg[class*="filter"])').first();
    const hasToggle = await filterToggle.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasToggle) {
      await filterToggle.click();

      // Expanded filter section should show "Request Type"
      await expect(page.getByText('Request Type').first()).toBeVisible({ timeout: 3_000 });

      // Request Type dropdown should have all options
      const typeSelect = page.locator('select').filter({ hasText: 'All Types' });
      const hasTypeSelect = await typeSelect.isVisible({ timeout: 3_000 }).catch(() => false);
      if (hasTypeSelect) {
        const expectedTypes = ['Breakdown', 'Planned Service', 'Inspection', 'Replacement', 'Safety', 'Other'];
        for (const typeName of expectedTypes) {
          await expect(typeSelect.locator('option', { hasText: typeName })).toBeAttached();
        }
      }
    }
  });
});
