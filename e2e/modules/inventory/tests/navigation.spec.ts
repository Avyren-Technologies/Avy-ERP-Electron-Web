import { test, expect } from '../fixture';
import { INVENTORY_ROUTES } from '../routes';

test.describe('Inventory Navigation', () => {
  const screens = [
    { name: 'Dashboard', path: INVENTORY_ROUTES.dashboard },
    { name: 'Stock Explorer', path: INVENTORY_ROUTES.stockExplorer },
    { name: 'Receive Stock', path: INVENTORY_ROUTES.receive },
    { name: 'GRN', path: INVENTORY_ROUTES.grn },
    { name: 'Put Away', path: INVENTORY_ROUTES.putAway },
    { name: 'Stock Transfer', path: INVENTORY_ROUTES.transfer },
    { name: 'Adjustments', path: INVENTORY_ROUTES.adjustments },
    { name: 'Issue & Pick', path: INVENTORY_ROUTES.issue },
    { name: 'Pack & Dispatch', path: INVENTORY_ROUTES.dispatch },
    { name: 'Returns', path: INVENTORY_ROUTES.returns },
    { name: 'Vendor Returns', path: INVENTORY_ROUTES.vendorReturns },
    { name: 'Stock Counts', path: INVENTORY_ROUTES.counts },
    { name: 'Approvals', path: INVENTORY_ROUTES.approvals },
    { name: 'Reports', path: INVENTORY_ROUTES.reports },
    { name: 'Config', path: INVENTORY_ROUTES.config },
    { name: 'Warehouse Master', path: INVENTORY_ROUTES.configWarehouses },
    { name: 'Item Policies', path: INVENTORY_ROUTES.configItemPolicies },
    // Phase 2 — Production Integration
    { name: 'Issue to Production', path: INVENTORY_ROUTES.productionIssue },
    { name: 'FG Receipt', path: INVENTORY_ROUTES.fgReceipt },
    { name: 'Material Return', path: INVENTORY_ROUTES.materialReturn },
    { name: 'Production Scrap', path: INVENTORY_ROUTES.productionScrap },
    { name: 'WO Reconciliation', path: INVENTORY_ROUTES.woReconciliation },
  ];

  for (const screen of screens) {
    test(`should load ${screen.name} screen`, async ({ page }) => {
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
