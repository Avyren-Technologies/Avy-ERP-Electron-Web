import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AssetListPage extends BasePage {
  readonly url = '/app/maintenance/assets';

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

  get addAssetButton(): Locator {
    return this.page.getByRole('button', { name: /add.*asset|new.*asset/i });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async viewAsset(rowIndex: number) {
    await this.tableRows.nth(rowIndex).getByTitle(/view/i).click();
  }

  async expectLoaded() {
    await expect(this.heading).toContainText(/asset/i);
  }
}
