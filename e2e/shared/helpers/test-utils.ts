import { Page, expect } from '@playwright/test';

/**
 * Wait for the page to be fully loaded (no pending network requests).
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for a toast/notification message to appear.
 */
export async function expectToast(page: Page, textPattern: RegExp | string) {
  const toast = page.locator('[class*="toast"], [class*="Toastify"], [role="alert"], [class*="notification"]');
  if (typeof textPattern === 'string') {
    await expect(toast.filter({ hasText: textPattern })).toBeVisible({ timeout: 10_000 });
  } else {
    await expect(toast.filter({ hasText: textPattern })).toBeVisible({ timeout: 10_000 });
  }
}

/**
 * Wait for skeleton/loading to disappear.
 */
export async function waitForDataLoad(page: Page) {
  // Wait for skeleton cards to disappear
  const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"], [class*="animate-pulse"]');
  if (await skeleton.count() > 0) {
    await expect(skeleton.first()).toBeHidden({ timeout: 15_000 });
  }
  // Also wait for any loading spinners
  const spinner = page.locator('[class*="animate-spin"]').first();
  if (await spinner.isVisible().catch(() => false)) {
    await expect(spinner).toBeHidden({ timeout: 15_000 });
  }
}

/**
 * Navigate to a maintenance page and wait for it to load.
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(`/app/maintenance/${path}`);
  await waitForDataLoad(page);
}

/**
 * Click a button by its text and wait for network response.
 */
export async function clickButtonAndWait(page: Page, buttonText: string | RegExp, urlPattern?: string | RegExp) {
  const btn = page.getByRole('button', { name: buttonText });
  if (urlPattern) {
    await Promise.all([
      page.waitForResponse((res) => {
        if (typeof urlPattern === 'string') return res.url().includes(urlPattern);
        return urlPattern.test(res.url());
      }),
      btn.click(),
    ]);
  } else {
    await btn.click();
  }
}

/**
 * Assert a table has at least N rows (useful for list screens).
 */
export async function expectTableRows(page: Page, minRows: number) {
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(minRows, { timeout: 10_000 });
}

/**
 * Fill a SearchableSelect component by label.
 */
export async function fillSearchableSelect(page: Page, label: string, searchText: string) {
  const field = page.locator(`text=${label}`).locator('..').locator('input, [role="combobox"]');
  await field.click();
  await field.fill(searchText);
  // Wait for dropdown options
  await page.waitForTimeout(500);
  // Click first option
  const option = page.locator('[class*="option"], [role="option"]').first();
  await option.click();
}

/**
 * Assert that an API response has the standard envelope structure.
 */
export function assertApiEnvelope(body: any, expectData = true) {
  expect(body).toHaveProperty('success', true);
  if (expectData) {
    expect(body).toHaveProperty('data');
  }
}
