import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class WorkOrderListPage extends BasePage {
  readonly url = '/app/maintenance/work-orders';

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  /* ── Selectors ── */

  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search/i);
  }

  get statusFilter(): Locator {
    return this.page.locator('select').first();
  }

  get priorityFilter(): Locator {
    return this.page.locator('select').nth(1);
  }

  get newWorkOrderButton(): Locator {
    return this.page.getByRole('link', { name: /new work order/i });
  }

  get boardViewButton(): Locator {
    return this.page.getByRole('link', { name: /board view/i });
  }

  /* ── Actions ── */

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // debounce
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.waitForLoad();
  }

  async filterByPriority(priority: string) {
    await this.priorityFilter.selectOption(priority);
    await this.waitForLoad();
  }

  /** Get WO number text from a specific row */
  async getWONumber(rowIndex: number): Promise<string> {
    return this.tableRows.nth(rowIndex).locator('td').first().innerText();
  }

  /** Get status badge text from a specific row */
  async getRowStatus(rowIndex: number): Promise<string> {
    const badge = this.tableRows.nth(rowIndex).locator('[class*="badge"], [class*="Badge"]').first();
    return badge.innerText();
  }

  /** Click "Approve" quick action for a row */
  async approveRow(rowIndex: number) {
    await this.tableRows.nth(rowIndex).getByRole('button', { name: /approve/i }).click();
  }

  /** Click "Assign" quick action for a row */
  async openAssignModal(rowIndex: number) {
    await this.tableRows.nth(rowIndex).getByRole('button', { name: /assign/i }).click();
  }

  /** Click "Start" quick action for a row */
  async startRow(rowIndex: number) {
    await this.tableRows.nth(rowIndex).getByRole('button', { name: /start/i }).click();
  }

  /** Click "View" (eye icon) for a row */
  async viewRow(rowIndex: number) {
    await this.tableRows.nth(rowIndex).getByTitle('View').click();
  }

  /** Click View link by WO number text */
  async viewByWONumber(woNumber: string) {
    const row = this.tableRows.filter({ hasText: woNumber });
    await row.getByTitle('View').click();
  }

  /* ── Assertions ── */

  async expectLoaded() {
    await expect(this.heading).toContainText(/work orders/i);
  }

  async expectRowCount(min: number) {
    await expect(this.tableRows).toHaveCount(min, { timeout: 10_000 });
  }

  async expectEmptyState() {
    await expect(this.page.getByText(/no work orders found/i)).toBeVisible();
  }
}
