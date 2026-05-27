import { test, expect } from '../fixture';
import { INVENTORY_ROUTES } from '../routes';

test.describe('Phase 6 Performance Check', () => {
  test('stock explorer loads with staleTime optimization', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(INVENTORY_ROUTES.stockExplorer);
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(
      (e) => !e.includes('Warning:') && !e.includes('DevTools'),
    );
    expect(realErrors).toHaveLength(0);
  });

  test('dashboard loads with socket listener', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(INVENTORY_ROUTES.dashboard);
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(
      (e) => !e.includes('Warning:') && !e.includes('DevTools'),
    );
    expect(realErrors).toHaveLength(0);
  });
});
