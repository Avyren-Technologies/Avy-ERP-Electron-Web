import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  /** Wait for skeleton/loading to disappear */
  async waitForLoad() {
    const skeleton = this.page.locator('[class*="skeleton"], [class*="Skeleton"], [class*="animate-pulse"]');
    if (await skeleton.count() > 0) {
      await expect(skeleton.first()).toBeHidden({ timeout: 15_000 });
    }
  }

  /** Get the page heading (h1) */
  get heading(): Locator {
    return this.page.locator('h1').first();
  }

  /** Get a toast notification */
  async expectToast(text: string | RegExp) {
    const toast = this.page.locator('[class*="toast"], [role="alert"], [class*="Toastify"]');
    await expect(toast.filter({ hasText: text })).toBeVisible({ timeout: 10_000 });
  }

  /** Click a button by its accessible name */
  async clickButton(name: string | RegExp) {
    await this.page.getByRole('button', { name }).click();
  }

  /** Get table rows */
  get tableRows(): Locator {
    return this.page.locator('tbody tr');
  }

  /** Get table row count */
  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  /** Click a link by text */
  async clickLink(text: string | RegExp) {
    await this.page.getByRole('link', { name: text }).click();
  }

  /** Fill an input field by placeholder */
  async fillByPlaceholder(placeholder: string | RegExp, value: string) {
    await this.page.getByPlaceholder(placeholder).fill(value);
  }

  /** Select dropdown by label text */
  async selectOption(labelOrLocator: string, value: string) {
    await this.page.locator(`select`).filter({ has: this.page.locator(`option[value="${value}"]`) }).selectOption(value);
  }
}
