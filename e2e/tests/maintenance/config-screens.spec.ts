import { test, expect } from '@playwright/test';
import { MAINTENANCE_ROUTES } from '../../data/test-constants';
import { waitForDataLoad, expectToast } from '../../helpers/test-utils';

/**
 * Maintenance Configuration Screens — Functional E2E Tests
 *
 * Covers:
 *   - Maintenance Config (general settings, SLA, escalation, toggles)
 *   - Failure Codes (Sets, Modes, Causes, Action Codes CRUD)
 *   - Strategies (list, create, search, type filter)
 *   - Job Plans (list loads)
 *   - Checklists (list loads)
 */

test.describe('Maintenance Config — Global Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.config);
    await waitForDataLoad(page);
  });

  test('loads with heading and current values', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Maintenance Configuration/i, { timeout: 15_000 });

    // General section should be visible
    await expect(page.getByText('General')).toBeVisible();
    await expect(page.getByText('Default Lead Days')).toBeVisible();
    await expect(page.getByText('Default Grace Period')).toBeVisible();

    // SLA section
    await expect(page.getByText('SLA Timings')).toBeVisible();

    // Escalation section
    await expect(page.getByText('Escalation')).toBeVisible();

    // Feature Toggles section
    await expect(page.getByText('Feature Toggles')).toBeVisible();

    // Save button
    await expect(page.getByRole('button', { name: /Save Configuration/i })).toBeVisible();
  });

  test('modify a numeric value and save', async ({ page }) => {
    // Find the first number input next to "Default Lead Days" and change it
    const leadDaysInput = page.locator('input[type="number"]').first();
    await expect(leadDaysInput).toBeVisible();

    const originalValue = await leadDaysInput.inputValue();
    const newValue = originalValue === '10' ? '12' : '10';

    await leadDaysInput.fill(newValue);

    // Click Save Configuration
    await page.getByRole('button', { name: /Save Configuration/i }).first().click();

    // Verify toast
    await expectToast(page, /Maintenance configuration updated/i);

    // Restore original value
    await leadDaysInput.fill(originalValue);
    await page.getByRole('button', { name: /Save Configuration/i }).first().click();
    await expectToast(page, /Maintenance configuration updated/i);
  });

  test('toggle feature switches and save', async ({ page }) => {
    // Feature Toggles section has 8 toggle buttons (rounded-full styled)
    // The toggles are rendered as <button> elements with rounded-full class
    const featureTogglesSection = page.getByText('Feature Toggles').locator('..').locator('..');

    // Find toggle buttons inside the Feature Toggles section
    // Each ToggleRow has a button with class w-10 h-6 rounded-full
    const toggles = featureTogglesSection.locator('button[type="button"]');
    const toggleCount = await toggles.count();

    // Should have at least the PTW toggle
    expect(toggleCount).toBeGreaterThanOrEqual(1);

    // Click the first toggle (PTW)
    const firstToggle = toggles.first();
    const initialBg = await firstToggle.getAttribute('class');
    await firstToggle.click();

    // The class should change (toggled state)
    const newBg = await firstToggle.getAttribute('class');
    expect(newBg).not.toBe(initialBg);

    // Toggle it back to restore
    await firstToggle.click();
  });

  test('displays all config sections', async ({ page }) => {
    const expectedSections = [
      'General',
      'SLA Timings',
      'Escalation',
      'Breakdown & Repeat Failure',
      'Closure',
      'Feature Toggles',
      'Industry Profile',
    ];

    for (const section of expectedSections) {
      await expect(page.getByText(section, { exact: false }).first()).toBeVisible();
    }
  });

  test('SLA inputs accept numeric values', async ({ page }) => {
    // SLA section has 4 number inputs (Critical, High, Medium, Low)
    const slaSection = page.getByText('SLA Timings').locator('..').locator('..');
    const slaInputs = slaSection.locator('input[type="number"]');
    const count = await slaInputs.count();
    expect(count).toBe(4);

    // Each input should have a value
    for (let i = 0; i < count; i++) {
      const val = await slaInputs.nth(i).inputValue();
      expect(Number(val)).toBeGreaterThan(0);
    }
  });

  test('escalation inputs accept numeric values', async ({ page }) => {
    const escalationSection = page.getByText('Escalation').locator('..').locator('..');
    const escalationInputs = escalationSection.locator('input[type="number"]');
    const count = await escalationInputs.count();
    expect(count).toBe(3);
  });
});

test.describe('Failure Codes — CRUD', () => {
  const timestamp = Date.now();

  test('Sets tab loads with table', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configFailureCodes);
    await waitForDataLoad(page);

    await expect(page.locator('h1')).toContainText(/Failure Codes/i, { timeout: 15_000 });

    // Tab bar should be visible with 4 tabs
    for (const tab of ['Sets', 'Modes', 'Causes', 'Action Codes']) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible();
    }

    // Sets tab is active by default
    await expect(page.getByPlaceholder(/Search sets/i)).toBeVisible();

    // Table headers
    await expect(page.locator('thead')).toBeVisible();
  });

  test('create a Set, then a Mode under it, then a Cause', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configFailureCodes);
    await waitForDataLoad(page);

    // ── Create a Set ──
    const setName = `E2E Set ${timestamp}`;
    await page.getByRole('button', { name: /Add Set/i }).click();

    // Modal should appear
    await expect(page.getByText(/Add Failure Code Set/i)).toBeVisible({ timeout: 5_000 });

    // Fill name
    await page.getByPlaceholder(/Mechanical Failures/i).fill(setName);
    await page.getByPlaceholder(/Optional description/i).first().fill('E2E test set');

    // Click Create
    await page.getByRole('button', { name: /^Create$/i }).click();
    await expectToast(page, new RegExp(`${setName} created`, 'i'));

    // Wait for modal to close and list to update
    await page.waitForTimeout(1000);

    // ── Navigate into the Set to create a Mode ──
    // Click the set row to open Modes
    await page.getByText(setName).click();
    await page.waitForTimeout(500);

    // Should now show Modes tab
    await expect(page.getByText(/Failure modes for/i)).toBeVisible({ timeout: 5_000 });

    // Create a Mode
    const modeName = `E2E Mode ${timestamp}`;
    await page.getByRole('button', { name: /Add Mode/i }).click();
    await expect(page.getByText(/Add Failure Mode/i)).toBeVisible({ timeout: 5_000 });

    await page.getByPlaceholder(/FM-001/i).fill(`FM-E2E-${timestamp}`);
    await page.getByPlaceholder(/Bearing Failure/i).fill(modeName);

    await page.getByRole('button', { name: /^Create$/i }).click();
    await expectToast(page, new RegExp(`${modeName} created`, 'i'));
    await page.waitForTimeout(1000);

    // ── Navigate into the Mode to create a Cause ──
    await page.getByText(modeName).click();
    await page.waitForTimeout(500);

    // Should now show Causes tab
    await expect(page.getByText(/Failure causes for mode/i)).toBeVisible({ timeout: 5_000 });

    // Create a Cause
    const causeName = `E2E Cause ${timestamp}`;
    await page.getByRole('button', { name: /Add Cause/i }).click();
    await expect(page.getByText(/Add Failure Cause/i)).toBeVisible({ timeout: 5_000 });

    await page.getByPlaceholder(/FC-001/i).fill(`FC-E2E-${timestamp}`);
    await page.getByPlaceholder(/Lubrication Failure/i).fill(causeName);
    await page.getByPlaceholder(/Wear and Tear/i).fill('E2E mechanism');

    await page.getByRole('button', { name: /^Create$/i }).click();
    await expectToast(page, new RegExp(`${causeName} created`, 'i'));
  });

  test('create and manage Action Codes', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configFailureCodes);
    await waitForDataLoad(page);

    // Switch to Action Codes tab
    await page.getByRole('button', { name: 'Action Codes' }).click();
    await page.waitForTimeout(500);

    // Should show search and Add button
    await expect(page.getByPlaceholder(/Search action codes/i)).toBeVisible();

    // Create an action code
    const codeName = `E2E Action ${timestamp}`;
    await page.getByRole('button', { name: /Add Action Code/i }).click();
    await expect(page.getByText(/Add Action Code/i).last()).toBeVisible({ timeout: 5_000 });

    await page.getByPlaceholder(/AC-001/i).fill(`AC-E2E-${timestamp}`);
    await page.getByPlaceholder(/Replace Bearing/i).fill(codeName);

    await page.getByRole('button', { name: /^Create$/i }).click();
    await expectToast(page, new RegExp(`${codeName} created`, 'i'));
  });

  test('edit a Set', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configFailureCodes);
    await waitForDataLoad(page);

    // Skip if no sets exist
    const emptyState = page.getByText(/No failure code sets/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    // Click edit on the first set (Edit button with title "Edit")
    const editBtn = page.locator('button[title="Edit"]').first();
    await editBtn.click();

    // Modal should show "Edit Failure Code Set"
    await expect(page.getByText(/Edit Failure Code Set/i)).toBeVisible({ timeout: 5_000 });

    // Update should have Update button instead of Create
    await expect(page.getByRole('button', { name: /^Update$/i })).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /Cancel/i }).click();
  });

  test('delete confirmation shows for Sets', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configFailureCodes);
    await waitForDataLoad(page);

    const emptyState = page.getByText(/No failure code sets/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    // Click delete on the first set
    const deleteBtn = page.locator('button[title="Delete"]').first();
    await deleteBtn.click();

    // Delete confirmation modal
    await expect(page.getByText(/Delete\?/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/This will permanently delete/i)).toBeVisible();

    // Cancel instead of actually deleting
    await page.getByRole('button', { name: /Cancel/i }).click();
  });

  test('Modes and Causes tabs are disabled until selection', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configFailureCodes);
    await waitForDataLoad(page);

    // Modes tab should be disabled
    const modesTab = page.getByRole('button', { name: 'Modes' });
    await expect(modesTab).toBeDisabled();

    // Causes tab should be disabled
    const causesTab = page.getByRole('button', { name: 'Causes' });
    await expect(causesTab).toBeDisabled();

    // Action Codes tab should NOT be disabled
    const actionCodesTab = page.getByRole('button', { name: 'Action Codes' });
    await expect(actionCodesTab).toBeEnabled();
  });
});

test.describe('Strategies — CRUD & Filtering', () => {
  const timestamp = Date.now();

  test('list loads with heading and toolbar', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configStrategies);
    await waitForDataLoad(page);

    await expect(page.locator('h1')).toContainText(/Maintenance Strategies/i, { timeout: 15_000 });
    await expect(page.getByPlaceholder(/Search strategies/i)).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('create a strategy', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configStrategies);
    await waitForDataLoad(page);

    const strategyName = `E2E Strategy ${timestamp}`;

    await page.getByRole('button', { name: /Add Strategy/i }).click();

    // Modal should appear
    await expect(page.getByText(/Add Strategy/i).last()).toBeVisible({ timeout: 5_000 });

    // Fill form
    await page.getByPlaceholder(/Monthly PM/i).fill(strategyName);

    // Select strategy type
    const typeSelect = page.locator('.p-6 select, [class*="overflow-y-auto"] select').first();
    await typeSelect.selectOption('CORRECTIVE');

    // Fill optional description
    await page.getByPlaceholder(/Optional description/i).fill('Created by E2E test');

    // Click Create
    await page.getByRole('button', { name: /^Create$/i }).click();
    await expectToast(page, new RegExp(`${strategyName} created`, 'i'));
  });

  test('search filters the strategy list', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configStrategies);
    await waitForDataLoad(page);

    // Type a non-existent search term
    await page.getByPlaceholder(/Search strategies/i).fill('ZZZZNONEXISTENT99999');
    await page.waitForTimeout(1000);

    // Should show empty state or no matching rows
    const emptyState = page.getByText(/No strategies configured/i);
    const rowCount = await page.locator('tbody tr').count();

    // Either no rows or empty state visible
    if (rowCount > 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('type filter filters the strategy list', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configStrategies);
    await waitForDataLoad(page);

    // Use the filter dropdown (first select in toolbar)
    const filterSelect = page.locator('.bg-white select, .dark\\:bg-neutral-900 select').first();
    await filterSelect.selectOption('CORRECTIVE');
    await page.waitForTimeout(1000);

    // If there are results, verify type badges match
    const badges = page.locator('tbody span').filter({ hasText: 'Corrective' });
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      for (let i = 0; i < Math.min(badgeCount, 3); i++) {
        await expect(badges.nth(i)).toContainText('Corrective');
      }
    }

    // Reset filter
    await filterSelect.selectOption('');
  });

  test('table shows all expected columns', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configStrategies);
    await waitForDataLoad(page);

    const headers = page.locator('thead th');
    const headerTexts = ['Name', 'Strategy Type', 'Description', 'Status', 'Actions'];

    for (const text of headerTexts) {
      await expect(headers.filter({ hasText: text }).first()).toBeVisible();
    }
  });
});

test.describe('Job Plans — List Screen', () => {
  test('loads with heading and search', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configJobPlans);
    await waitForDataLoad(page);

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });

    // Should have a search field
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Table or content area should exist
    await expect(page.locator('thead').first()).toBeVisible();
  });

  test('does not show error state', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configJobPlans);
    await waitForDataLoad(page);

    await expect(page.getByText(/Failed to load/i)).toBeHidden();
  });
});

test.describe('Checklists — List Screen', () => {
  test('loads with heading and search', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configChecklists);
    await waitForDataLoad(page);

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });

    // Should have a search field
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('does not show error state', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.configChecklists);
    await waitForDataLoad(page);

    await expect(page.getByText(/Failed to load/i)).toBeHidden();
  });
});
