import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class WorkRequestListPage extends BasePage {
  readonly url = '/app/maintenance/work-requests';

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search/i);
  }

  get newRequestButton(): Locator {
    return this.page.getByRole('link', { name: /new.*request/i });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async expectLoaded() {
    await expect(this.heading).toContainText(/work request/i);
  }
}
