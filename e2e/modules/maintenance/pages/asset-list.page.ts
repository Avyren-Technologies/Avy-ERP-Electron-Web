import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../../shared/pages/base.page';
import { MAINTENANCE_ROUTES } from '../routes';

/**
 * Page object for the Asset Register list screen.
 */
export class AssetListPage extends BasePage {
  readonly searchInput: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search/i);
    this.createButton = page.getByRole('button', { name: /add|create|new/i });
  }

  async goto() {
    await this.page.goto(MAINTENANCE_ROUTES.assets);
    await this.waitForLoad();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async clickAssetRow(index = 0) {
    await this.tableRows.nth(index).click();
  }
}
