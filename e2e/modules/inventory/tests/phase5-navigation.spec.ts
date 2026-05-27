import { test, expect } from '../fixture';
import { INVENTORY_ROUTES } from '../routes';

test.describe('Phase 5 Navigation', () => {
  const screens = [
    { name: 'Analytics', path: INVENTORY_ROUTES.analytics },
    { name: 'Stock Value', path: INVENTORY_ROUTES.stockValue },
    { name: 'Search', path: INVENTORY_ROUTES.search },
    { name: 'Import', path: INVENTORY_ROUTES.importData },
    { name: 'Export', path: INVENTORY_ROUTES.exportData },
  ];

  for (const screen of screens) {
    test(`should load ${screen.name}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(screen.path);
      await page.waitForLoadState('networkidle');

      const realErrors = errors.filter(
        (e) => !e.includes('Warning:') && !e.includes('DevTools'),
      );
      expect(realErrors).toHaveLength(0);
    });
  }
});
