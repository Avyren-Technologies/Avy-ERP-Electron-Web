import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../../shared/pages/base.page';
import { MAINTENANCE_ROUTES } from '../routes';

/**
 * Page object for the Maintenance Dashboard screen.
 */
export class MaintenanceDashboardPage extends BasePage {
  readonly kpiCards: Locator;
  readonly chartsSection: Locator;

  constructor(page: Page) {
    super(page);
    this.kpiCards = page.locator('[data-testid="kpi-card"], .kpi-card');
    this.chartsSection = page.locator('[data-testid="charts-section"], .charts-section');
  }

  async goto() {
    await this.page.goto(MAINTENANCE_ROUTES.dashboard);
    await this.waitForLoad();
  }
}
