import { test, expect } from '../fixture';
import { INVENTORY_ROUTES } from '../routes';

test.describe('Phase 3 Navigation', () => {
  const screens = [
    { name: 'Putaway Rules', path: INVENTORY_ROUTES.putawayRules },
    { name: 'Pallets', path: INVENTORY_ROUTES.pallets },
    { name: 'Staging', path: INVENTORY_ROUTES.staging },
    { name: 'Tool Life Policies', path: INVENTORY_ROUTES.toolLifePolicies },
    { name: 'Tool Issue', path: INVENTORY_ROUTES.toolIssue },
    { name: 'Tool Return', path: INVENTORY_ROUTES.toolReturn },
    { name: 'Reconditioning', path: INVENTORY_ROUTES.reconditioning },
    { name: 'Tool Status Report', path: INVENTORY_ROUTES.toolReports },
    { name: 'Tools at Machine', path: INVENTORY_ROUTES.toolReportsAtMachine },
    { name: 'Tool Consumption', path: INVENTORY_ROUTES.toolReportsConsumption },
    { name: 'Reconditioning Register', path: INVENTORY_ROUTES.toolReportsReconditioning },
    { name: 'Tool Breakage', path: INVENTORY_ROUTES.toolReportsBreakage },
  ];

  for (const screen of screens) {
    test(`should load ${screen.name}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(screen.path);
      await page.waitForLoadState('networkidle');

      // Filter out known React dev warnings and DevTools noise
      const realErrors = errors.filter(
        (e) => !e.includes('Warning:') && !e.includes('DevTools'),
      );
      expect(realErrors).toHaveLength(0);
    });
  }
});
