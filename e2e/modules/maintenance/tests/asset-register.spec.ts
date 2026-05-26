import { test, expect, type Page } from '@playwright/test';
import { MAINTENANCE_ROUTES } from '../routes';

/**
 * Asset Register — Functional E2E Tests
 *
 * Tests the complete business logic of the Asset Register screen:
 * page layout, search, filters, CRUD operations, form validation,
 * manage-master-data modals, and asset detail navigation.
 *
 * Pre-requisites:
 *   - Auth storageState is configured (company-admin logged in)
 *   - Backend running at localhost:3030
 *   - Web app running at localhost:5173
 */

const ASSET_URL = MAINTENANCE_ROUTES.assets;

/* ── Helpers ── */

/** Wait for the asset table (or empty state) to finish loading. */
async function waitForTableReady(page: Page) {
  // Wait for skeleton / pulse animations to disappear
  const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"], [class*="animate-pulse"]');
  if (await skeleton.count() > 0) {
    await expect(skeleton.first()).toBeHidden({ timeout: 15_000 });
  }
}

/** Expect a sonner / toast notification containing the given text. */
async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.locator(
    '[data-sonner-toast], [class*="toast"], [role="status"], [role="alert"]',
  );
  await expect(toast.filter({ hasText: text })).toBeVisible({ timeout: 10_000 });
}

/** Open the Add Asset modal and wait for it to render. */
async function openAddAssetModal(page: Page) {
  await page.getByRole('button', { name: /add\s*asset/i }).click();
  await expect(page.getByRole('heading', { name: /add new asset/i })).toBeVisible({ timeout: 5_000 });
}

/** Fill the "Name" field inside the asset modal. */
async function fillAssetName(page: Page, name: string) {
  const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /asset/i }) });
  await modal.getByPlaceholder('Asset name').fill(name);
}

/** Click the primary save/create button inside the asset modal. */
async function clickModalSave(page: Page) {
  const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /asset/i }) });
  const saveBtn = modal.getByRole('button', { name: /create asset|update asset/i });
  await saveBtn.click();
}

/** Close the asset modal via the Cancel button. */
async function closeAssetModal(page: Page) {
  const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /asset/i }) });
  await modal.getByRole('button', { name: /cancel/i }).click();
  await expect(modal).toBeHidden({ timeout: 3_000 });
}

/** Generate a unique asset name to avoid collisions across runs. */
function uniqueName(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ================================================================
   1. Page Load & Layout
   ================================================================ */

test.describe('Asset Register — Page Load & Layout', () => {
  test('page loads with title, search, filters, and action buttons', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    // Title
    await expect(page.locator('h1')).toContainText('Asset Register');

    // Search input
    await expect(page.getByPlaceholder(/search by name, code, serial/i)).toBeVisible();

    // Filter dropdowns visible in toolbar (Asset Class, Criticality)
    const selects = page.locator('.bg-white, .dark\\:bg-neutral-900').first().locator('select');
    // The toolbar has at least 2 selects: Asset Class + Criticality
    expect(await selects.count()).toBeGreaterThanOrEqual(2);

    // Manage dropdown button
    await expect(page.getByRole('button', { name: /manage/i })).toBeVisible();

    // Add Asset button
    await expect(page.getByRole('button', { name: /add\s*asset/i })).toBeVisible();
  });

  test('table headers are visible', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    const expectedHeaders = [
      'Asset Number',
      'Name',
      'Class',
      'Criticality',
      'Status',
      'Location',
      'Category',
      'Actions',
    ];

    for (const header of expectedHeaders) {
      await expect(page.locator('thead th').filter({ hasText: header })).toBeVisible();
    }
  });
});

/* ================================================================
   2. Search Functionality
   ================================================================ */

test.describe('Asset Register — Search', () => {
  test('search filters the table and empty search restores results', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    const searchInput = page.getByPlaceholder(/search by name, code, serial/i);

    // Capture initial row count
    const initialRows = await page.locator('tbody tr').count();

    // Type a non-matching query
    await searchInput.fill('zzz_nonexistent_asset_xyz_999');
    // Wait for the debounced request to settle
    await page.waitForTimeout(800);
    await waitForTableReady(page);

    // Should show empty state or zero rows
    const emptyState = page.locator('text=No assets found');
    const rowCount = await page.locator('tbody tr').count();
    // Either we see the empty-state message, or we have fewer rows (in case some
    // asset name coincidentally matches, which is extremely unlikely).
    const isEmpty = await emptyState.isVisible().catch(() => false);
    expect(isEmpty || rowCount < initialRows).toBeTruthy();

    // Clear the search
    await searchInput.fill('');
    await page.waitForTimeout(800);
    await waitForTableReady(page);

    // Row count should be restored (or at least match initial)
    const restoredRows = await page.locator('tbody tr').count();
    expect(restoredRows).toBeGreaterThanOrEqual(initialRows > 0 ? 1 : 0);
  });
});

/* ================================================================
   3. Filter Functionality
   ================================================================ */

test.describe('Asset Register — Filters', () => {
  test('filter by criticality and clear filters', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    // Find the Criticality select (the one with "All Criticalities" option)
    const critSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'All Criticalities' }) });
    await expect(critSelect).toBeVisible();

    // Select "Critical"
    await critSelect.selectOption('CRITICAL');
    await page.waitForTimeout(600);
    await waitForTableReady(page);

    // The "Clear" button should now be visible (since a filter is active)
    const clearBtn = page.getByRole('button', { name: /clear/i }).or(page.locator('button').filter({ hasText: /clear/i }));
    await expect(clearBtn).toBeVisible({ timeout: 3_000 });

    // Click Clear to reset
    await clearBtn.click();
    await page.waitForTimeout(600);
    await waitForTableReady(page);

    // Criticality select should be back to "All Criticalities" (empty value)
    await expect(critSelect).toHaveValue('');
  });

  test('expand advanced filters panel shows operational/maintenance/location', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    // Click the filter toggle button (has <Filter> icon)
    const filterToggle = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).nth(0);
    // More reliable: look for the button with title or the one right after Criticality select
    // The filter button is the one with just the Filter icon
    const filterButtons = page.locator('button').filter({
      has: page.locator('svg.lucide-filter, svg[class*="lucide"]'),
    });

    // Find the specific filter-toggle button by checking it is near toolbar selects
    // Use the toolbar container and find the filter icon button
    const toolbar = page.locator('.bg-white').filter({ has: page.getByPlaceholder(/search/i) });
    const filterBtn = toolbar.locator('button').filter({ has: page.locator('svg') }).last();

    // There should be a button that toggles the extra filters section
    // After clicking, "Operational Status", "Maintenance Status", "Location" labels should appear
    await filterBtn.click();
    await page.waitForTimeout(300);

    // Check for the advanced filter labels
    const opStatusLabel = page.locator('label, legend').filter({ hasText: /operational status/i });
    const maintStatusLabel = page.locator('label, legend').filter({ hasText: /maintenance status/i });
    const locationLabel = page.locator('label, legend').filter({ hasText: /location/i });

    // At least one of these should now be visible
    const anyVisible =
      (await opStatusLabel.isVisible().catch(() => false)) ||
      (await maintStatusLabel.isVisible().catch(() => false)) ||
      (await locationLabel.isVisible().catch(() => false));

    expect(anyVisible).toBeTruthy();
  });
});

/* ================================================================
   4. Add Asset — Form Validation
   ================================================================ */

test.describe('Asset Register — Form Validation', () => {
  test('submit button is disabled when name field is empty', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);
    await openAddAssetModal(page);

    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /add new asset/i }) });
    const nameInput = modal.getByPlaceholder('Asset name');

    // Ensure name is empty
    await nameInput.fill('');

    // The "Create Asset" button should be disabled
    const createBtn = modal.getByRole('button', { name: /create asset/i });
    await expect(createBtn).toBeDisabled();

    // Close the modal
    await closeAssetModal(page);
  });

  test('filling name enables submit button', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);
    await openAddAssetModal(page);

    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /add new asset/i }) });
    const nameInput = modal.getByPlaceholder('Asset name');
    const createBtn = modal.getByRole('button', { name: /create asset/i });

    // Fill name
    await nameInput.fill('Test Validation Asset');

    // Button should now be enabled (name is filled, assetClass has default "MACHINE")
    await expect(createBtn).toBeEnabled();

    await closeAssetModal(page);
  });
});

/* ================================================================
   5. Add Asset — Create with minimal + full fields (serial)
   ================================================================ */

test.describe.serial('Asset Register — CRUD Lifecycle', () => {
  const assetName = uniqueName('E2E-Asset');
  const updatedName = uniqueName('E2E-Updated');
  let createdAssetName = assetName;

  test('create asset with minimal fields (name + assetClass)', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);
    await openAddAssetModal(page);

    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /add new asset/i }) });

    // Fill Identity section
    await modal.getByPlaceholder('Asset name').fill(assetName);
    // assetClass defaults to MACHINE — leave as is

    // Submit
    const createBtn = modal.getByRole('button', { name: /create asset/i });
    await expect(createBtn).toBeEnabled();

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/maintenance/assets') && res.request().method() === 'POST'),
      createBtn.click(),
    ]);

    // Verify toast
    await expectToast(page, /asset created/i);

    // Wait for table to refresh
    await page.waitForTimeout(1_000);
    await waitForTableReady(page);

    // Verify the new asset appears in the table
    await expect(page.locator('tbody').getByText(assetName)).toBeVisible({ timeout: 10_000 });
  });

  test('create asset with extended fields', async ({ page }) => {
    const fullName = uniqueName('E2E-Full');
    createdAssetName = fullName;

    await page.goto(ASSET_URL);
    await waitForTableReady(page);
    await openAddAssetModal(page);

    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /add new asset/i }) });

    // -- Identity section --
    await modal.getByPlaceholder('Asset name').fill(fullName);
    // Select asset class — keep default MACHINE or pick another
    const assetClassSelect = modal.locator('fieldset').filter({ hasText: /identity/i }).locator('select').first();
    await assetClassSelect.selectOption({ index: 1 }); // Pick first non-empty option
    await modal.getByPlaceholder('Serial number').fill('SN-E2E-12345');

    // -- Classification section --
    const classificationSection = modal.locator('fieldset').filter({ hasText: /classification/i });
    // Criticality
    const critSelect = classificationSection.locator('select').filter({ has: page.locator('option', { hasText: 'Critical' }) });
    if (await critSelect.count() > 0) {
      await critSelect.selectOption('HIGH');
    }
    // Ownership select
    const ownershipSelect = classificationSection.locator('select').filter({ has: page.locator('option', { hasText: 'Owned' }) });
    if (await ownershipSelect.count() > 0) {
      await ownershipSelect.selectOption({ index: 0 });
    }

    // -- Technical section --
    const techSection = modal.locator('fieldset').filter({ hasText: /technical/i });
    await techSection.getByPlaceholder('Manufacturer').fill('E2E Manufacturer');
    await techSection.getByPlaceholder('Brand').fill('E2E Brand');
    await techSection.getByPlaceholder('Model number').fill('MDL-E2E-001');

    // -- Financial section --
    const finSection = modal.locator('fieldset').filter({ hasText: /financial/i });
    const purchaseCostInput = finSection.locator('input[type="number"]').first();
    await purchaseCostInput.fill('50000');
    const replacementInput = finSection.locator('input[type="number"]').last();
    await replacementInput.fill('75000');

    // Submit
    const createBtn = modal.getByRole('button', { name: /create asset/i });
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/maintenance/assets') && res.request().method() === 'POST'),
      createBtn.click(),
    ]);

    await expectToast(page, /asset created/i);
    await page.waitForTimeout(1_000);
    await waitForTableReady(page);

    await expect(page.locator('tbody').getByText(fullName)).toBeVisible({ timeout: 10_000 });
  });

  test('edit an existing asset', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    // Find the row with the first created asset
    const row = page.locator('tbody tr').filter({ hasText: assetName });
    await expect(row).toBeVisible({ timeout: 10_000 });

    // Click the Edit button (has title="Edit")
    await row.locator('button[title="Edit"]').click();

    // Modal should open with "Edit Asset" heading
    await expect(page.getByRole('heading', { name: /edit asset/i })).toBeVisible({ timeout: 5_000 });

    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /edit asset/i }) });

    // Verify pre-filled name
    const nameInput = modal.getByPlaceholder('Asset name');
    await expect(nameInput).toHaveValue(assetName);

    // Change the name
    await nameInput.fill(updatedName);

    // Submit
    const updateBtn = modal.getByRole('button', { name: /update asset/i });
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/maintenance/assets') && res.request().method() === 'PATCH'),
      updateBtn.click(),
    ]);

    await expectToast(page, /asset updated/i);
    await page.waitForTimeout(1_000);
    await waitForTableReady(page);

    // Updated name should now appear in table
    await expect(page.locator('tbody').getByText(updatedName)).toBeVisible({ timeout: 10_000 });
  });

  test('delete asset — cancel then confirm', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    // Find the row with the updated asset
    const row = page.locator('tbody tr').filter({ hasText: updatedName });
    await expect(row).toBeVisible({ timeout: 10_000 });

    // Click the Delete button (has title="Delete")
    await row.locator('button[title="Delete"]').click();

    // Inline confirmation should appear with "Yes" and "No" buttons
    await expect(row.getByRole('button', { name: 'Yes' })).toBeVisible({ timeout: 3_000 });
    await expect(row.getByRole('button', { name: 'No' })).toBeVisible();

    // Click "No" to cancel
    await row.getByRole('button', { name: 'No' }).click();

    // Asset should still be in the table
    await expect(row).toBeVisible();

    // Click Delete again
    await row.locator('button[title="Delete"]').click();
    await expect(row.getByRole('button', { name: 'Yes' })).toBeVisible({ timeout: 3_000 });

    // Click "Yes" to confirm deletion
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/maintenance/assets') && res.request().method() === 'DELETE'),
      row.getByRole('button', { name: 'Yes' }).click(),
    ]);

    await expectToast(page, /deleted/i);

    // Wait for table to refresh — the row should be gone
    await page.waitForTimeout(1_000);
    await waitForTableReady(page);

    await expect(page.locator('tbody').getByText(updatedName)).toBeHidden({ timeout: 10_000 });
  });

  test('clean up — delete the full-field asset', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    const row = page.locator('tbody tr').filter({ hasText: createdAssetName });
    // If the asset exists, delete it to clean up
    if (await row.isVisible().catch(() => false)) {
      await row.locator('button[title="Delete"]').click();
      await row.getByRole('button', { name: 'Yes' }).click();
      await expectToast(page, /deleted/i);
    }
  });
});

/* ================================================================
   6. Manage Categories Modal
   ================================================================ */

test.describe.serial('Asset Register — Manage Categories', () => {
  const categoryName = uniqueName('E2E-Category');
  const categoryUpdated = uniqueName('E2E-CatUpdated');

  test('open Manage Categories, create, edit, and delete a category', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    // Open Manage dropdown
    await page.getByRole('button', { name: /manage/i }).click();
    await page.waitForTimeout(300);

    // Click "Manage Categories"
    await page.getByRole('button', { name: /manage categories/i }).click();

    // ManageModal should open
    await expect(page.getByRole('heading', { name: /manage categories/i })).toBeVisible({ timeout: 5_000 });

    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /manage categories/i }) });

    // -- CREATE --
    const nameField = modal.getByPlaceholder('e.g. Rotating Equipment');
    await nameField.fill(categoryName);
    const createBtn = modal.getByRole('button', { name: /create/i });
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/categories') && res.request().method() === 'POST'),
      createBtn.click(),
    ]);
    await expectToast(page, /created successfully/i);
    await page.waitForTimeout(500);

    // Verify item appears in the list
    await expect(modal.locator('span').filter({ hasText: categoryName })).toBeVisible({ timeout: 5_000 });

    // -- EDIT --
    // Hover over the item row to reveal edit/delete buttons
    const itemRow = modal.locator('div.group, div[class*="rounded-xl"]').filter({ hasText: categoryName });
    await itemRow.hover();
    await itemRow.locator('button[title="Edit"]').click();

    // Edit input should be focused with current value
    const editInput = itemRow.locator('input');
    await expect(editInput).toBeVisible();
    await editInput.fill(categoryUpdated);

    // Save edit
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/categories') && res.request().method() === 'PATCH'),
      itemRow.getByRole('button', { name: /save/i }).click(),
    ]);
    await expectToast(page, /updated successfully/i);
    await page.waitForTimeout(500);

    // Verify updated name
    await expect(modal.locator('span').filter({ hasText: categoryUpdated })).toBeVisible({ timeout: 5_000 });

    // -- DELETE --
    const updatedRow = modal.locator('div.group, div[class*="rounded-xl"]').filter({ hasText: categoryUpdated });
    await updatedRow.hover();
    await updatedRow.locator('button[title="Delete"]').click();

    // Confirmation: "Delete?" text + Yes/No
    await expect(updatedRow.getByText('Delete?')).toBeVisible({ timeout: 3_000 });
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/categories') && res.request().method() === 'DELETE'),
      updatedRow.getByRole('button', { name: /yes/i }).click(),
    ]);
    await expectToast(page, /deleted successfully/i);

    // Item should be gone
    await page.waitForTimeout(500);
    await expect(modal.locator('span').filter({ hasText: categoryUpdated })).toBeHidden({ timeout: 5_000 });

    // Close modal
    await modal.getByRole('button', { name: /close/i }).click();
  });
});

/* ================================================================
   7. Manage Asset Classes Modal
   ================================================================ */

test.describe.serial('Asset Register — Manage Asset Classes', () => {
  const className = uniqueName('E2E-AssetClass');

  test('open Manage Asset Classes, verify defaults, create and delete', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    // Open Manage dropdown
    await page.getByRole('button', { name: /manage/i }).click();
    await page.waitForTimeout(300);

    // Click "Manage Asset Classes"
    await page.getByRole('button', { name: /manage asset classes/i }).click();

    await expect(page.getByRole('heading', { name: /manage asset classes/i })).toBeVisible({ timeout: 5_000 });

    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /manage asset classes/i }) });

    // If default asset class options exist, verify at least one is visible
    // (e.g., MACHINE, VEHICLE — these are DB-driven so may or may not exist)
    // We just proceed to create a new one.

    // -- CREATE --
    const nameField = modal.getByPlaceholder('e.g. Machine');
    await nameField.fill(className);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/asset-class-options') && res.request().method() === 'POST'),
      modal.getByRole('button', { name: /create/i }).click(),
    ]);
    await expectToast(page, /created successfully/i);
    await page.waitForTimeout(500);

    // Verify it appears
    await expect(modal.locator('span').filter({ hasText: className })).toBeVisible({ timeout: 5_000 });

    // -- DELETE (clean up) --
    const itemRow = modal.locator('div.group, div[class*="rounded-xl"]').filter({ hasText: className });
    await itemRow.hover();
    await itemRow.locator('button[title="Delete"]').click();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/asset-class-options') && res.request().method() === 'DELETE'),
      itemRow.getByRole('button', { name: /yes/i }).click(),
    ]);
    await expectToast(page, /deleted successfully/i);

    // Close
    await modal.getByRole('button', { name: /close/i }).click();
  });
});

/* ================================================================
   8. Manage Ownership Types Modal
   ================================================================ */

test.describe('Asset Register — Manage Ownership Types', () => {
  const ownershipName = uniqueName('E2E-Ownership');

  test('create and delete an ownership type', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    await page.getByRole('button', { name: /manage/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /manage ownership types/i }).click();

    await expect(page.getByRole('heading', { name: /manage ownership types/i })).toBeVisible({ timeout: 5_000 });
    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /manage ownership types/i }) });

    // Create
    await modal.getByPlaceholder('e.g. Owned').fill(ownershipName);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/ownership-options') && res.request().method() === 'POST'),
      modal.getByRole('button', { name: /create/i }).click(),
    ]);
    await expectToast(page, /created successfully/i);
    await page.waitForTimeout(500);
    await expect(modal.locator('span').filter({ hasText: ownershipName })).toBeVisible({ timeout: 5_000 });

    // Delete
    const row = modal.locator('div.group, div[class*="rounded-xl"]').filter({ hasText: ownershipName });
    await row.hover();
    await row.locator('button[title="Delete"]').click();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/ownership-options') && res.request().method() === 'DELETE'),
      row.getByRole('button', { name: /yes/i }).click(),
    ]);
    await expectToast(page, /deleted successfully/i);

    await modal.getByRole('button', { name: /close/i }).click();
  });
});

/* ================================================================
   9. Manage PTW Classes Modal
   ================================================================ */

test.describe('Asset Register — Manage PTW Classes', () => {
  const ptwName = uniqueName('E2E-PTWClass');

  test('create and delete a PTW class', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    await page.getByRole('button', { name: /manage/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /manage ptw classes/i }).click();

    await expect(page.getByRole('heading', { name: /manage ptw classes/i })).toBeVisible({ timeout: 5_000 });
    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /manage ptw classes/i }) });

    // Create
    await modal.getByPlaceholder('e.g. Hot Work').fill(ptwName);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/ptw-class-options') && res.request().method() === 'POST'),
      modal.getByRole('button', { name: /create/i }).click(),
    ]);
    await expectToast(page, /created successfully/i);
    await page.waitForTimeout(500);
    await expect(modal.locator('span').filter({ hasText: ptwName })).toBeVisible({ timeout: 5_000 });

    // Delete
    const row = modal.locator('div.group, div[class*="rounded-xl"]').filter({ hasText: ptwName });
    await row.hover();
    await row.locator('button[title="Delete"]').click();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/ptw-class-options') && res.request().method() === 'DELETE'),
      row.getByRole('button', { name: /yes/i }).click(),
    ]);
    await expectToast(page, /deleted successfully/i);

    await modal.getByRole('button', { name: /close/i }).click();
  });
});

/* ================================================================
   10. Manage Types Modal
   ================================================================ */

test.describe('Asset Register — Manage Asset Types', () => {
  const typeName = uniqueName('E2E-Type');

  test('create and delete an asset type', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    await page.getByRole('button', { name: /manage/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /manage types/i }).click();

    await expect(page.getByRole('heading', { name: /manage asset types/i })).toBeVisible({ timeout: 5_000 });
    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /manage asset types/i }) });

    // Create
    await modal.getByPlaceholder('e.g. Centrifugal Pump').fill(typeName);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/types') && res.request().method() === 'POST'),
      modal.getByRole('button', { name: /create/i }).click(),
    ]);
    await expectToast(page, /created successfully/i);
    await page.waitForTimeout(500);
    await expect(modal.locator('span').filter({ hasText: typeName })).toBeVisible({ timeout: 5_000 });

    // Delete
    const row = modal.locator('div.group, div[class*="rounded-xl"]').filter({ hasText: typeName });
    await row.hover();
    await row.locator('button[title="Delete"]').click();
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/types') && res.request().method() === 'DELETE'),
      row.getByRole('button', { name: /yes/i }).click(),
    ]);
    await expectToast(page, /deleted successfully/i);

    await modal.getByRole('button', { name: /close/i }).click();
  });
});

/* ================================================================
   11. Asset Detail Navigation
   ================================================================ */

test.describe('Asset Register — Detail Navigation', () => {
  test('clicking view navigates to asset detail page', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      // No assets to navigate to — create one first via the API or skip
      test.skip(true, 'No assets in the register to test detail navigation');
      return;
    }

    // Get the View link from the first row (it is an <a> with title="View Details")
    const firstRow = rows.first();
    const viewLink = firstRow.locator('a[title="View Details"]');
    const href = await viewLink.getAttribute('href');

    expect(href).toBeTruthy();
    expect(href).toMatch(/\/app\/maintenance\/assets\/.+/);

    // Navigate
    await viewLink.click();

    // Should land on the detail page
    await page.waitForURL(/\/app\/maintenance\/assets\/.+/, { timeout: 10_000 });

    // The detail page should have tabs (Overview, Meters, History, etc.)
    await expect(page.getByText(/overview/i)).toBeVisible({ timeout: 10_000 });
  });
});

/* ================================================================
   12. Modal Close Behaviour
   ================================================================ */

test.describe('Asset Register — Modal Interactions', () => {
  test('cancel button closes add asset modal without saving', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);
    await openAddAssetModal(page);

    const modal = page.locator('.fixed.inset-0').filter({ has: page.getByRole('heading', { name: /add new asset/i }) });

    // Fill a name
    await modal.getByPlaceholder('Asset name').fill('Should Not Be Saved');

    // Click Cancel
    await modal.getByRole('button', { name: /cancel/i }).click();

    // Modal should close
    await expect(modal).toBeHidden({ timeout: 3_000 });

    // "Should Not Be Saved" should NOT appear in the table
    await expect(page.locator('tbody').getByText('Should Not Be Saved')).toBeHidden();
  });

  test('clicking backdrop closes the modal', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);
    await openAddAssetModal(page);

    const overlay = page.locator('.fixed.inset-0.z-50').first();

    // Click the backdrop (top-left corner, which is outside the modal card)
    await overlay.click({ position: { x: 5, y: 5 } });

    // Modal heading should disappear
    await expect(page.getByRole('heading', { name: /add new asset/i })).toBeHidden({ timeout: 3_000 });
  });

  test('Manage dropdown menu shows all 6 options', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    await page.getByRole('button', { name: /manage/i }).click();
    await page.waitForTimeout(300);

    const expectedOptions = [
      'Manage Categories',
      'Manage Sub-Categories',
      'Manage Types',
      'Manage Asset Classes',
      'Manage Ownership Types',
      'Manage PTW Classes',
    ];

    for (const option of expectedOptions) {
      await expect(page.getByRole('button', { name: option })).toBeVisible();
    }
  });
});

/* ================================================================
   13. Sync Machines Button
   ================================================================ */

test.describe('Asset Register — Sync Machines', () => {
  test('sync machines button triggers API call', async ({ page }) => {
    await page.goto(ASSET_URL);
    await waitForTableReady(page);

    const syncBtn = page.getByRole('button', { name: /sync machines/i });
    await expect(syncBtn).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/sync-machines') && res.request().method() === 'POST',
        { timeout: 15_000 },
      ),
      syncBtn.click(),
    ]);

    // Should show success or error toast — either way the call completed
    const toast = page.locator('[data-sonner-toast], [class*="toast"], [role="status"], [role="alert"]');
    await expect(toast.first()).toBeVisible({ timeout: 10_000 });
  });
});
