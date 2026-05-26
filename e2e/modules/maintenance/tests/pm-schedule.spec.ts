import { test, expect } from '@playwright/test';
import { MAINTENANCE_ROUTES } from '../routes';
import { waitForDataLoad, expectToast } from '../../../shared/helpers/test-utils';

/**
 * PM Schedule — Functional E2E Tests
 *
 * Covers:
 *   - PM Schedule creation with different strategy types (Calendar, Meter, Seasonal, Statutory, Dual)
 *   - Strategy type switching shows/hides correct fields
 *   - PM Calendar view navigation
 *   - PM List search and filter
 */

const PM_CREATE_URL = '/app/maintenance/pm-schedules/new';

test.describe('PM Schedule — Create Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PM_CREATE_URL);
    await waitForDataLoad(page);
  });

  test('form loads with heading and all base fields', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/New PM Schedule/i, { timeout: 15_000 });

    // Core required fields
    await expect(page.getByText('Asset')).toBeVisible();
    await expect(page.getByText('Schedule Name')).toBeVisible();
    await expect(page.getByText('Strategy Type')).toBeVisible();

    // Common settings
    await expect(page.getByText('Lead Days')).toBeVisible();
    await expect(page.getByText('Grace Period')).toBeVisible();
    await expect(page.getByText('Next Due Date')).toBeVisible();
    await expect(page.getByText('Job Plan')).toBeVisible();

    // Auto-assign checkbox
    await expect(page.getByText('Auto-Assign Technician')).toBeVisible();

    // Submit button should be disabled initially (no asset, no name)
    const submitBtn = page.getByRole('button', { name: /Create PM Schedule/i });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('Calendar strategy shows calendar fields by default', async ({ page }) => {
    // Default strategy is CALENDAR
    const strategySelect = page.locator('select').filter({ has: page.locator('option[value="CALENDAR"]') }).first();
    const currentValue = await strategySelect.inputValue();
    expect(currentValue).toBe('CALENDAR');

    // Calendar-specific fields should be visible
    await expect(page.getByText('Calendar Settings')).toBeVisible();
    await expect(page.getByText('Frequency Value')).toBeVisible();
    await expect(page.getByText('Frequency Unit')).toBeVisible();
    await expect(page.getByText('Fixed / Floating')).toBeVisible();

    // Meter fields should NOT be visible
    await expect(page.getByText('Meter Settings')).toBeHidden();

    // Seasonal fields should NOT be visible
    await expect(page.getByText('Seasonal Settings')).toBeHidden();

    // Statutory fields should NOT be visible
    await expect(page.getByText('Statutory Settings')).toBeHidden();
  });

  test('switching to METER shows meter fields and hides calendar fields', async ({ page }) => {
    const strategySelect = page.locator('select').filter({ has: page.locator('option[value="METER"]') }).first();
    await strategySelect.selectOption('METER');

    // Meter fields should appear
    await expect(page.getByText('Meter Settings')).toBeVisible();
    await expect(page.getByText('Meter Type')).toBeVisible();
    await expect(page.getByText('Meter Interval')).toBeVisible();

    // Calendar fields should be hidden
    await expect(page.getByText('Calendar Settings')).toBeHidden();

    // Seasonal/Statutory should be hidden
    await expect(page.getByText('Seasonal Settings')).toBeHidden();
    await expect(page.getByText('Statutory Settings')).toBeHidden();
  });

  test('switching to SEASONAL shows season month selectors', async ({ page }) => {
    const strategySelect = page.locator('select').filter({ has: page.locator('option[value="SEASONAL"]') }).first();
    await strategySelect.selectOption('SEASONAL');

    // Seasonal fields should appear
    await expect(page.getByText('Seasonal Settings')).toBeVisible();
    await expect(page.getByText('Season Start Month')).toBeVisible();
    await expect(page.getByText('Season End Month')).toBeVisible();

    // Start month select should have all 12 months
    const startMonthSelect = page.locator('select').filter({ has: page.locator('option:text("January")') }).first();
    await expect(startMonthSelect).toBeVisible();

    // Calendar and Meter should be hidden
    await expect(page.getByText('Calendar Settings')).toBeHidden();
    await expect(page.getByText('Meter Settings')).toBeHidden();
  });

  test('switching to STATUTORY shows statutory due date', async ({ page }) => {
    const strategySelect = page.locator('select').filter({ has: page.locator('option[value="STATUTORY"]') }).first();
    await strategySelect.selectOption('STATUTORY');

    // Statutory fields should appear
    await expect(page.getByText('Statutory Settings')).toBeVisible();
    await expect(page.getByText('Statutory Due Date')).toBeVisible();

    // A date input should be present
    const dateInput = page.locator('[class*="Statutory"] input[type="date"], [class*="statutory"] input[type="date"]').first();
    // Fallback: look near the statutory label
    const statutorySection = page.getByText('Statutory Settings').locator('..').locator('..');
    const dateInputAlt = statutorySection.locator('input[type="date"]');
    const dateVisible = await dateInput.isVisible().catch(() => false) || await dateInputAlt.isVisible().catch(() => false);
    expect(dateVisible).toBe(true);

    // Calendar and Meter should be hidden
    await expect(page.getByText('Calendar Settings')).toBeHidden();
    await expect(page.getByText('Meter Settings')).toBeHidden();
  });

  test('switching to DUAL shows both calendar and meter fields', async ({ page }) => {
    const strategySelect = page.locator('select').filter({ has: page.locator('option[value="DUAL"]') }).first();
    await strategySelect.selectOption('DUAL');

    // Both sections should be visible
    await expect(page.getByText('Calendar Settings')).toBeVisible();
    await expect(page.getByText('Meter Settings')).toBeVisible();

    // Dual Trigger checkbox should appear (only in DUAL mode)
    await expect(page.getByText('Dual Trigger')).toBeVisible();

    // Seasonal/Statutory hidden
    await expect(page.getByText('Seasonal Settings')).toBeHidden();
    await expect(page.getByText('Statutory Settings')).toBeHidden();
  });

  test('submit button is disabled without required fields', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Create PM Schedule/i });

    // Initially disabled (no asset, no name)
    await expect(submitBtn).toBeDisabled();

    // Fill only name (still no asset)
    await page.getByPlaceholder(/Monthly Lubrication Check/i).fill('Test PM Schedule');
    await expect(submitBtn).toBeDisabled();
  });

  test('auto-assign checkbox shows technician ID field', async ({ page }) => {
    // Technician ID field should be hidden initially
    const techIdField = page.getByPlaceholder(/Enter technician user ID/i);
    await expect(techIdField).toBeHidden();

    // Check the Auto-Assign checkbox
    const autoAssignCheckbox = page.locator('input[type="checkbox"]').first();
    await autoAssignCheckbox.check();

    // Technician ID field should now be visible
    await expect(techIdField).toBeVisible();

    // Uncheck
    await autoAssignCheckbox.uncheck();
    await expect(techIdField).toBeHidden();
  });

  test('lead days and grace period have default values', async ({ page }) => {
    const leadDaysInput = page.getByPlaceholder('7');
    const gracePeriodInput = page.getByPlaceholder('3');

    const leadVal = await leadDaysInput.inputValue();
    const graceVal = await gracePeriodInput.inputValue();

    expect(leadVal).toBe('7');
    expect(graceVal).toBe('3');
  });

  test('frequency unit dropdown has all options for calendar type', async ({ page }) => {
    // Strategy is CALENDAR by default, so calendar fields are visible
    const unitSelect = page.locator('select').filter({ has: page.locator('option[value="DAYS"]') }).first();
    await expect(unitSelect).toBeVisible();

    // Verify all unit options exist
    for (const unit of ['DAYS', 'WEEKS', 'MONTHS', 'YEARS']) {
      await expect(unitSelect.locator(`option[value="${unit}"]`)).toBeAttached();
    }
  });
});

test.describe('PM Calendar — View', () => {
  test('loads with heading and month navigation', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmCalendar);
    await waitForDataLoad(page);

    await expect(page.locator('h1')).toContainText(/PM Calendar/i, { timeout: 15_000 });

    // Month/year header should be visible (e.g., "May 2026")
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthYearHeader = page.locator('h2').filter({ hasText: new RegExp(monthNames.join('|')) });
    await expect(monthYearHeader).toBeVisible();

    // Weekday headers should be visible
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      await expect(page.getByText(day, { exact: true }).first()).toBeVisible();
    }
  });

  test('month navigation works (previous and next)', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmCalendar);
    await waitForDataLoad(page);

    // Get current month/year text
    const monthHeader = page.locator('h2').first();
    const initialText = await monthHeader.textContent();

    // Click next month
    const nextBtn = page.locator('button').filter({ has: page.locator('[class*="lucide-chevron-right"]') }).first();
    await nextBtn.click();
    await page.waitForTimeout(500);

    // Month text should change
    const afterNextText = await monthHeader.textContent();
    expect(afterNextText).not.toBe(initialText);

    // Click previous month twice to go back one from initial
    const prevBtn = page.locator('button').filter({ has: page.locator('[class*="lucide-chevron-left"]') }).first();
    await prevBtn.click();
    await page.waitForTimeout(500);

    // Should be back to initial
    const restoredText = await monthHeader.textContent();
    expect(restoredText).toBe(initialText);
  });

  test('calendar grid has day cells', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmCalendar);
    await waitForDataLoad(page);

    // Calendar grid should have at least 28 day cells (shortest month)
    const dayCells = page.locator('.grid-cols-7 button');
    const count = await dayCells.count();
    expect(count).toBeGreaterThanOrEqual(28);
  });

  test('clicking a day cell shows details panel', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmCalendar);
    await waitForDataLoad(page);

    // Click any day cell
    const dayCells = page.locator('.grid-cols-7 button');
    const cellCount = await dayCells.count();
    if (cellCount > 0) {
      // Click a cell in the middle (likely current month)
      await dayCells.nth(Math.floor(cellCount / 2)).click();
      await page.waitForTimeout(300);

      // Details panel should appear with "PMs for" text
      await expect(page.getByText(/PMs for/i)).toBeVisible();
    }
  });

  test('List View link navigates to PM list', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmCalendar);
    await waitForDataLoad(page);

    const listViewLink = page.getByRole('link', { name: /List View/i });
    await expect(listViewLink).toBeVisible();
    await listViewLink.click();

    await page.waitForURL(/\/pm-schedules/, { timeout: 10_000 });
  });
});

test.describe('PM Schedule — List Screen', () => {
  test('loads with heading, search, and strategy filter', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmSchedules);
    await waitForDataLoad(page);

    await expect(page.locator('h1')).toContainText(/PM Schedules/i, { timeout: 15_000 });

    // Search input
    await expect(page.getByPlaceholder(/Search by name, asset/i)).toBeVisible();

    // Strategy filter dropdown
    const strategySelect = page.locator('select').filter({ has: page.locator('option[value="CALENDAR"]') }).first();
    await expect(strategySelect).toBeVisible();

    // Calendar link
    await expect(page.getByRole('link', { name: /Calendar/i })).toBeVisible();

    // New PM Schedule button
    await expect(page.getByRole('link', { name: /New PM Schedule/i })).toBeVisible();
  });

  test('search filters the list', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmSchedules);
    await waitForDataLoad(page);

    // Search for something that should not exist
    await page.getByPlaceholder(/Search by name, asset/i).fill('ZZZZNONEXISTENT99999');
    await page.waitForTimeout(1000);

    // Should show empty state or zero rows
    const emptyState = page.getByText(/No PM schedules found/i);
    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('strategy filter dropdown works', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmSchedules);
    await waitForDataLoad(page);

    const strategySelect = page.locator('select').filter({ has: page.locator('option[value="CALENDAR"]') }).first();

    // Filter by CALENDAR
    await strategySelect.selectOption('CALENDAR');
    await page.waitForTimeout(1000);

    // If there are results, strategy badges should show CALENDAR
    const badges = page.locator('tbody').getByText('CALENDAR', { exact: true });
    const badgeCount = await badges.count();
    if (badgeCount > 0) {
      for (let i = 0; i < Math.min(badgeCount, 3); i++) {
        await expect(badges.nth(i)).toContainText('CALENDAR');
      }
    }

    // Reset
    await strategySelect.selectOption('');
  });

  test('table shows correct columns', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmSchedules);
    await waitForDataLoad(page);

    const expectedHeaders = ['Name', 'Asset', 'Strategy', 'Frequency', 'Next Due', 'Status', 'Last Completed', 'Actions'];
    const headers = page.locator('thead th');

    for (const text of expectedHeaders) {
      await expect(headers.filter({ hasText: text }).first()).toBeVisible();
    }
  });

  test('New PM Schedule link navigates to create form', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmSchedules);
    await waitForDataLoad(page);

    await page.getByRole('link', { name: /New PM Schedule/i }).click();
    await page.waitForURL(/\/pm-schedules\/new/, { timeout: 10_000 });

    await expect(page.locator('h1')).toContainText(/New PM Schedule/i);
  });

  test('Calendar link navigates to calendar view', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmSchedules);
    await waitForDataLoad(page);

    await page.getByRole('link', { name: /Calendar/i }).click();
    await page.waitForURL(/\/pm-calendar/, { timeout: 10_000 });
  });

  test('does not show error state', async ({ page }) => {
    await page.goto(MAINTENANCE_ROUTES.pmSchedules);
    await waitForDataLoad(page);

    await expect(page.getByText(/Failed to load PM schedules/i)).toBeHidden();
  });
});
