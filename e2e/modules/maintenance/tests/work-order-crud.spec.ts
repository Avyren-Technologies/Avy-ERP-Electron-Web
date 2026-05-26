import { test, expect, type Page } from '@playwright/test';

/**
 * Work Order CRUD — Functional E2E Tests
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

const WO_CREATE_URL = '/app/maintenance/work-orders/new';
const WO_LIST_URL = '/app/maintenance/work-orders';
const WO_BOARD_URL = '/app/maintenance/work-orders/board';

/** Wait for any skeleton / loading spinners to disappear */
async function waitForLoad(page: Page) {
  // Wait for the main content to stabilise — the loading spinner uses Loader2
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  // Also ensure no inline spinners remain
  await page.locator('.animate-spin').first().waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {});
}

/**
 * Pick the first available asset inside the AssetPicker (SearchableSelect).
 * The AssetPicker renders a SearchableSelect with a text input.
 */
async function pickFirstAsset(page: Page) {
  // The AssetPicker label reads "Asset" and is required (*).
  // The SearchableSelect has a clickable trigger / input area.
  const assetPicker = page.locator('text=Asset').locator('..').locator('..');

  // Click the select trigger to open the dropdown
  const trigger = assetPicker.locator('[role="combobox"], input[type="text"], button').first();
  await trigger.click();

  // Wait for at least one option to appear
  const firstOption = page.locator('[role="option"]').first();
  const optionVisible = await firstOption.isVisible({ timeout: 10_000 }).catch(() => false);

  if (!optionVisible) {
    // Fallback: try clicking the SearchableSelect container directly
    await assetPicker.locator('div').first().click();
    await page.waitForTimeout(1_000);
  }

  // Select the first option
  await page.locator('[role="option"]').first().click({ timeout: 10_000 });
}

/**
 * Navigate to the first WO in the list matching a given status, or skip.
 * Returns the page URL if found, null otherwise.
 */
async function navigateToWOByStatus(page: Page, status: string): Promise<string | null> {
  await page.goto(WO_LIST_URL);
  await waitForLoad(page);

  // Use the status filter dropdown
  const statusSelect = page.locator('select').filter({ hasText: 'All Statuses' });
  if (await statusSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await statusSelect.selectOption(status);
    await waitForLoad(page);
  }

  // Click the first "View" eye icon link in the table
  const viewLink = page.locator('a[title="View"]').first();
  const hasRow = await viewLink.isVisible({ timeout: 5_000 }).catch(() => false);
  if (!hasRow) return null;

  await viewLink.click();
  await waitForLoad(page);
  return page.url();
}

/* ------------------------------------------------------------------ */
/*  1. Create WO — Form Validation                                   */
/* ------------------------------------------------------------------ */

test.describe('Work Order Create — Form Validation', () => {
  test('form loads with correct defaults (CORRECTIVE, MEDIUM)', async ({ page }) => {
    await page.goto(WO_CREATE_URL);
    await waitForLoad(page);

    // Heading
    await expect(page.getByRole('heading', { name: 'New Work Order' })).toBeVisible();

    // WO Type defaults to CORRECTIVE
    const woTypeSelect = page.locator('select').nth(0); // first <select> in form
    await expect(woTypeSelect).toHaveValue('CORRECTIVE');

    // Priority defaults to MEDIUM
    const prioritySelect = page.locator('select').nth(1);
    await expect(prioritySelect).toHaveValue('MEDIUM');
  });

  test('submit button is disabled when no asset is selected', async ({ page }) => {
    await page.goto(WO_CREATE_URL);
    await waitForLoad(page);

    const submitBtn = page.getByRole('button', { name: 'Create Work Order' });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('submit button enables after selecting an asset', async ({ page }) => {
    await page.goto(WO_CREATE_URL);
    await waitForLoad(page);

    const submitBtn = page.getByRole('button', { name: 'Create Work Order' });
    await expect(submitBtn).toBeDisabled();

    // Pick the first available asset
    await pickFirstAsset(page);

    // Now the button should be enabled (assetId is set)
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
  });

  test('create WO with minimal fields and verify success toast + redirect', async ({ page }) => {
    await page.goto(WO_CREATE_URL);
    await waitForLoad(page);

    await pickFirstAsset(page);

    const submitBtn = page.getByRole('button', { name: 'Create Work Order' });
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
    await submitBtn.click();

    // Expect success toast
    await expect(
      page.getByText('Work order has been created successfully.')
    ).toBeVisible({ timeout: 15_000 });

    // Should redirect to the work orders list
    await expect(page).toHaveURL(/\/app\/maintenance\/work-orders\/?$/, { timeout: 10_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  2. Create WO — All Fields                                        */
/* ------------------------------------------------------------------ */

test.describe('Work Order Create — All Fields', () => {
  test('fill all fields and submit successfully', async ({ page }) => {
    await page.goto(WO_CREATE_URL);
    await waitForLoad(page);

    // Asset
    await pickFirstAsset(page);

    // WO Type
    const woTypeSelect = page.locator('select').nth(0);
    await woTypeSelect.selectOption('PREVENTIVE');
    await expect(woTypeSelect).toHaveValue('PREVENTIVE');

    // Priority
    const prioritySelect = page.locator('select').nth(1);
    await prioritySelect.selectOption('HIGH');
    await expect(prioritySelect).toHaveValue('HIGH');

    // Job Plan (optional — select first non-empty option if available)
    const jobPlanSelect = page.locator('select').nth(2);
    const jobPlanOptions = jobPlanSelect.locator('option');
    const jobPlanCount = await jobPlanOptions.count();
    if (jobPlanCount > 1) {
      // Select the first real job plan (index 1, since index 0 is "No job plan")
      await jobPlanSelect.selectOption({ index: 1 });
    }

    // Description
    const descriptionField = page.locator('textarea');
    await descriptionField.fill('E2E test — preventive maintenance inspection on asset');

    // Planned Start
    const plannedStartInput = page.locator('input[type="datetime-local"]').nth(0);
    await plannedStartInput.fill('2026-06-01T09:00');

    // Planned End
    const plannedEndInput = page.locator('input[type="datetime-local"]').nth(1);
    await plannedEndInput.fill('2026-06-01T17:00');

    // Estimated Hours
    const estimatedHoursInput = page.locator('input[type="number"]');
    await estimatedHoursInput.fill('8');

    // Submit
    const submitBtn = page.getByRole('button', { name: 'Create Work Order' });
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
    await submitBtn.click();

    // Verify toast
    await expect(
      page.getByText('Work order has been created successfully.')
    ).toBeVisible({ timeout: 15_000 });

    // Verify redirect
    await expect(page).toHaveURL(/\/app\/maintenance\/work-orders\/?$/, { timeout: 10_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  3. WO Detail — Overview Tab                                       */
/* ------------------------------------------------------------------ */

test.describe('Work Order Detail — Overview Tab', () => {
  test('displays WO number, status, type, priority, and asset info', async ({ page }) => {
    await page.goto(WO_LIST_URL);
    await waitForLoad(page);

    // Click the first visible "View" link
    const viewLink = page.locator('a[title="View"]').first();
    const hasWO = await viewLink.isVisible({ timeout: 5_000 }).catch(() => false);
    test.skip(!hasWO, 'No work orders exist in the system to view');

    await viewLink.click();
    await waitForLoad(page);

    // Heading
    await expect(page.getByText('Work Order Detail')).toBeVisible();

    // WO number badge (e.g. "WO-00001")
    const woNumber = page.locator('span').filter({ hasText: /^WO-\d+$/ }).first();
    await expect(woNumber).toBeVisible({ timeout: 5_000 });

    // Overview tab should be active by default (contains "Description" heading)
    await expect(page.getByText('Description')).toBeVisible();

    // Scheduling section
    await expect(page.getByText('Scheduling')).toBeVisible();
    await expect(page.getByText('Planned Start')).toBeVisible();

    // Asset side card
    await expect(page.getByText('Asset').first()).toBeVisible();

    // Details side card (WO Type, Priority, etc.)
    await expect(page.getByText('Details').first()).toBeVisible();
    await expect(page.getByText('WO Type')).toBeVisible();
    await expect(page.getByText('Priority')).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  4. WO Detail — Tab Navigation                                     */
/* ------------------------------------------------------------------ */

test.describe('Work Order Detail — Tab Navigation', () => {
  test('click each tab and verify content changes', async ({ page }) => {
    await page.goto(WO_LIST_URL);
    await waitForLoad(page);

    const viewLink = page.locator('a[title="View"]').first();
    const hasWO = await viewLink.isVisible({ timeout: 5_000 }).catch(() => false);
    test.skip(!hasWO, 'No work orders exist');

    await viewLink.click();
    await waitForLoad(page);

    // Overview tab is active by default
    await expect(page.getByText('Description')).toBeVisible();

    // -- Checklist tab --
    await page.getByRole('button', { name: 'Checklist' }).click();
    // Should show either checklist items or "No Checklist" empty state
    const checklistContent = page.getByText(/No Checklist|Item \d+|Checklist/);
    await expect(checklistContent.first()).toBeVisible({ timeout: 5_000 });

    // -- Parts tab --
    await page.getByRole('button', { name: 'Parts' }).click();
    const partsContent = page.getByText(/No Parts|Item|Qty/);
    await expect(partsContent.first()).toBeVisible({ timeout: 5_000 });

    // -- Labour tab --
    await page.getByRole('button', { name: 'Labour' }).click();
    const labourContent = page.getByText(/No Labour Logs|Technician|Hours/);
    await expect(labourContent.first()).toBeVisible({ timeout: 5_000 });

    // -- Evidence tab --
    await page.getByRole('button', { name: 'Evidence' }).click();
    const evidenceContent = page.getByText(/No Evidence|evidence/i);
    await expect(evidenceContent.first()).toBeVisible({ timeout: 5_000 });

    // -- Cost tab --
    await page.getByRole('button', { name: 'Cost' }).click();
    await expect(page.getByText('Cost Summary')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Labour Cost')).toBeVisible();
    await expect(page.getByText('Parts Cost')).toBeVisible();
    await expect(page.getByText('Total Cost')).toBeVisible();

    // -- History tab --
    await page.getByRole('button', { name: 'History' }).click();
    const historyContent = page.getByText(/No History|Event|CREATED/i);
    await expect(historyContent.first()).toBeVisible({ timeout: 5_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  5. WO Detail — Approve Action (DRAFT WO)                         */
/* ------------------------------------------------------------------ */

test.describe('Work Order Detail — Approve Action', () => {
  test('approve a DRAFT work order and verify status changes', async ({ page }) => {
    const url = await navigateToWOByStatus(page, 'DRAFT');
    test.skip(!url, 'No DRAFT work orders available to test approval');

    // Verify Approve button is visible
    const approveBtn = page.getByRole('button', { name: 'Approve' });
    await expect(approveBtn).toBeVisible({ timeout: 5_000 });

    // Click Approve
    await approveBtn.click();

    // Verify success toast
    await expect(page.getByText('Work order approved.')).toBeVisible({ timeout: 15_000 });

    // After approval, the Assign button should appear (status is now APPROVED)
    await expect(page.getByRole('button', { name: 'Assign' })).toBeVisible({ timeout: 10_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  6. WO Detail — Assign Technician (APPROVED WO)                   */
/* ------------------------------------------------------------------ */

test.describe('Work Order Detail — Assign Technician', () => {
  test('assign a technician to an APPROVED work order', async ({ page }) => {
    const url = await navigateToWOByStatus(page, 'APPROVED');
    test.skip(!url, 'No APPROVED work orders available to test assignment');

    // Click Assign button
    const assignBtn = page.getByRole('button', { name: 'Assign' });
    await expect(assignBtn).toBeVisible({ timeout: 5_000 });
    await assignBtn.click();

    // Modal should open with title "Assign Work Order"
    await expect(page.getByText('Assign Work Order')).toBeVisible({ timeout: 5_000 });

    // The modal has a SearchableSelect for "Lead Technician"
    await expect(page.getByText('Lead Technician')).toBeVisible();

    // Click the SearchableSelect trigger to open its dropdown
    const searchInput = page.locator('[role="combobox"], input[placeholder*="Search"]').last();
    await searchInput.click();

    // Wait for employee options to load, then select the first
    const firstOption = page.locator('[role="option"]').first();
    const hasOption = await firstOption.isVisible({ timeout: 10_000 }).catch(() => false);
    test.skip(!hasOption, 'No employees available for assignment');

    await firstOption.click();

    // Confirm assignment
    const confirmBtn = page.getByRole('button', { name: 'Assign' }).last();
    await expect(confirmBtn).toBeEnabled({ timeout: 3_000 });
    await confirmBtn.click();

    // Verify success toast
    await expect(page.getByText('Work order assigned.')).toBeVisible({ timeout: 15_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  7. WO Detail — Hold with Reason (IN_PROGRESS WO)                 */
/* ------------------------------------------------------------------ */

test.describe('Work Order Detail — Hold with Reason', () => {
  test('put an IN_PROGRESS work order on hold with a reason', async ({ page }) => {
    const url = await navigateToWOByStatus(page, 'IN_PROGRESS');
    test.skip(!url, 'No IN_PROGRESS work orders available');

    // Click Hold button
    const holdBtn = page.getByRole('button', { name: 'Hold' });
    await expect(holdBtn).toBeVisible({ timeout: 5_000 });
    await holdBtn.click();

    // Modal should open: "Hold Work Order"
    await expect(page.getByText('Hold Work Order')).toBeVisible({ timeout: 5_000 });

    // The hold modal has a textarea for reason
    const reasonTextarea = page.locator('textarea[placeholder*="hold"]');
    await expect(reasonTextarea).toBeVisible();

    // The "Put on Hold" button should be disabled until reason is filled
    const confirmBtn = page.getByRole('button', { name: 'Put on Hold' });
    await expect(confirmBtn).toBeDisabled();

    // Fill in the reason
    await reasonTextarea.fill('Waiting for replacement parts to arrive');

    // Now the confirm button should be enabled
    await expect(confirmBtn).toBeEnabled({ timeout: 3_000 });
    await confirmBtn.click();

    // Verify success toast
    await expect(page.getByText('Work order put on hold.')).toBeVisible({ timeout: 15_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  8. WO Detail — Cancel with Confirmation                          */
/* ------------------------------------------------------------------ */

test.describe('Work Order Detail — Cancel', () => {
  test('cancel a non-terminal work order', async ({ page }) => {
    // Try to find a DRAFT or APPROVED WO to cancel
    let url = await navigateToWOByStatus(page, 'DRAFT');
    if (!url) {
      url = await navigateToWOByStatus(page, 'APPROVED');
    }
    if (!url) {
      url = await navigateToWOByStatus(page, 'ASSIGNED');
    }
    test.skip(!url, 'No cancellable work orders available');

    const cancelBtn = page.getByRole('button', { name: 'Cancel' }).first();
    const hasCancelBtn = await cancelBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    test.skip(!hasCancelBtn, 'Cancel button not visible for this WO status');

    await cancelBtn.click();

    // Verify success toast
    await expect(page.getByText('Work order cancelled.')).toBeVisible({ timeout: 15_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  9. WO Board View                                                  */
/* ------------------------------------------------------------------ */

test.describe('Work Order Board View', () => {
  test('board page loads and renders status columns', async ({ page }) => {
    await page.goto(WO_BOARD_URL);
    await waitForLoad(page);

    // The board has columns for each status
    const expectedColumns = ['Draft', 'Planned', 'Approved', 'Assigned', 'In Progress', 'On Hold', 'Completed'];

    for (const col of expectedColumns) {
      await expect(page.getByText(col, { exact: true }).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('board view link is accessible from list page', async ({ page }) => {
    await page.goto(WO_LIST_URL);
    await waitForLoad(page);

    const boardLink = page.getByRole('link', { name: 'Board View' });
    await expect(boardLink).toBeVisible();
    await boardLink.click();

    await expect(page).toHaveURL(/\/board\/?$/, { timeout: 10_000 });
  });
});
