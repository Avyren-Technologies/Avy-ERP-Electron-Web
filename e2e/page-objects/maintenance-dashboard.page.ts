import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class MaintenanceDashboardPage extends BasePage {
  readonly url = '/app/maintenance/dashboard';

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  /** Stat cards on the dashboard */
  get statCards(): Locator {
    return this.page.locator('[class*="rounded-2xl"], [class*="rounded-xl"]').filter({ has: this.page.locator('p, span') });
  }

  async expectLoaded() {
    await expect(this.heading).toContainText(/maintenance|dashboard/i);
  }
}
