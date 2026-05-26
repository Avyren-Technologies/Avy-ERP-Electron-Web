import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class WorkOrderDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(id: string) {
    await this.page.goto(`/app/maintenance/work-orders/${id}`);
    await this.waitForLoad();
  }

  /* ── Selectors ── */

  get woNumber(): Locator {
    return this.page.locator('[class*="bg-primary-50"]').first();
  }

  get statusBadge(): Locator {
    return this.page.locator('[class*="badge"], [class*="Badge"]').first();
  }

  get backButton(): Locator {
    return this.page.locator('button').filter({ has: this.page.locator('svg') }).first();
  }

  /* ── Tab Navigation ── */

  async switchTab(tabName: 'Overview' | 'Checklist' | 'Parts' | 'Labour' | 'Evidence' | 'Cost' | 'History') {
    await this.page.getByRole('button', { name: tabName, exact: false }).click();
  }

  /* ── Action Buttons ── */

  get approveButton(): Locator {
    return this.page.getByRole('button', { name: /^approve$/i });
  }

  get assignButton(): Locator {
    return this.page.getByRole('button', { name: /^assign$/i });
  }

  get acknowledgeButton(): Locator {
    return this.page.getByRole('button', { name: /^acknowledge$/i });
  }

  get startButton(): Locator {
    return this.page.getByRole('button', { name: /^start$/i });
  }

  get holdButton(): Locator {
    return this.page.getByRole('button', { name: /^hold$/i });
  }

  get resumeButton(): Locator {
    return this.page.getByRole('button', { name: /^resume$/i });
  }

  get completeButton(): Locator {
    return this.page.getByRole('button', { name: /^complete$/i });
  }

  get closeButton(): Locator {
    return this.page.getByRole('button', { name: /^close$/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: /^cancel$/i });
  }

  get reopenButton(): Locator {
    return this.page.getByRole('button', { name: /^reopen$/i });
  }

  get declineButton(): Locator {
    return this.page.getByRole('button', { name: /^decline$/i });
  }

  /* ── Modal Interactions ── */

  async fillModalTextarea(text: string) {
    const textarea = this.page.locator('.fixed textarea, [class*="modal"] textarea');
    await textarea.fill(text);
  }

  async confirmModal(buttonText?: string | RegExp) {
    const label = buttonText || /confirm|submit|save|assign|approve|close|hold|decline|reject|reopen|complete/i;
    const modal = this.page.locator('.fixed, [class*="modal"]');
    await modal.getByRole('button', { name: label }).click();
  }

  async cancelModal() {
    const modal = this.page.locator('.fixed, [class*="modal"]');
    await modal.getByRole('button', { name: /cancel/i }).click();
  }

  /* ── Assign Modal ── */

  async assignTechnician(searchText: string) {
    await this.assignButton.click();
    // Wait for modal
    await expect(this.page.locator('.fixed')).toBeVisible();
    // Search for technician in SearchableSelect
    const input = this.page.locator('.fixed input[type="text"], .fixed [role="combobox"]').first();
    await input.fill(searchText);
    await this.page.waitForTimeout(500);
    // Select first option
    const option = this.page.locator('.fixed [class*="option"]').first();
    if (await option.isVisible()) {
      await option.click();
    }
    // Click Assign button in modal
    await this.confirmModal(/assign/i);
  }

  /* ── Assertions ── */

  async expectStatus(status: string) {
    await expect(this.page.locator('text=' + status).first()).toBeVisible({ timeout: 10_000 });
  }

  async expectLoaded() {
    await expect(this.page.locator('text=Work Order Detail')).toBeVisible({ timeout: 10_000 });
  }

  async expectActionButtonVisible(button: 'approve' | 'assign' | 'acknowledge' | 'start' | 'hold' | 'complete' | 'close' | 'cancel' | 'reopen' | 'decline') {
    const locator = this[`${button}Button`] as Locator;
    await expect(locator).toBeVisible();
  }

  async expectActionButtonHidden(button: 'approve' | 'assign' | 'acknowledge' | 'start' | 'hold' | 'complete' | 'close' | 'cancel' | 'reopen' | 'decline') {
    const locator = this[`${button}Button`] as Locator;
    await expect(locator).toBeHidden();
  }
}
