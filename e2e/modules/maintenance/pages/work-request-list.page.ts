import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../../shared/pages/base.page';
import { MAINTENANCE_ROUTES } from '../routes';

/**
 * Page object for the Work Request list screen.
 */
export class WorkRequestListPage extends BasePage {
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly statusFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search/i);
    this.createButton = page.getByRole('button', { name: /add|create|new/i });
    this.statusFilter = page.locator('select').first();
  }

  async goto() {
    await this.page.goto(MAINTENANCE_ROUTES.workRequests);
    await this.waitForLoad();
  }

  async gotoNew() {
    await this.page.goto(MAINTENANCE_ROUTES.workRequestNew);
    await this.waitForLoad();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async clickRow(index = 0) {
    await this.tableRows.nth(index).click();
  }
}
