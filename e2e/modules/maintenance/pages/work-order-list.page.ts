import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../../shared/pages/base.page';
import { MAINTENANCE_ROUTES } from '../routes';

/**
 * Page object for the Work Order list screen.
 */
export class WorkOrderListPage extends BasePage {
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly statusFilter: Locator;
  readonly boardViewLink: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search/i);
    this.createButton = page.getByRole('button', { name: /add|create|new/i });
    this.statusFilter = page.locator('select').first();
    this.boardViewLink = page.getByRole('link', { name: /board/i });
  }

  async goto() {
    await this.page.goto(MAINTENANCE_ROUTES.workOrders);
    await this.waitForLoad();
  }

  async gotoNew() {
    await this.page.goto(MAINTENANCE_ROUTES.workOrderNew);
    await this.waitForLoad();
  }

  async gotoBoard() {
    await this.page.goto(MAINTENANCE_ROUTES.workOrderBoard);
    await this.waitForLoad();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async clickRow(index = 0) {
    await this.tableRows.nth(index).click();
  }
}
