import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../../shared/pages/base.page';

/**
 * Page object for the Work Order detail / view screen.
 */
export class WorkOrderDetailPage extends BasePage {
  readonly statusBadge: Locator;
  readonly assignButton: Locator;
  readonly approveButton: Locator;
  readonly startButton: Locator;
  readonly completeButton: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.statusBadge = page.locator('[data-testid="status-badge"], .status-badge').first();
    this.assignButton = page.getByRole('button', { name: /assign/i });
    this.approveButton = page.getByRole('button', { name: /approve/i });
    this.startButton = page.getByRole('button', { name: /start/i });
    this.completeButton = page.getByRole('button', { name: /complete/i });
    this.closeButton = page.getByRole('button', { name: /close/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async goto(id: string) {
    await this.page.goto(`/app/maintenance/work-orders/${id}`);
    await this.waitForLoad();
  }
}
