import { test, expect } from '../fixture';
import { INVENTORY_ROUTES } from '../routes';

test.describe('Phase 4 Navigation', () => {
  test('should load Industry Templates screen', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(INVENTORY_ROUTES.industry);
    await page.waitForLoadState('networkidle');

    const realErrors = errors.filter(
      (e) => !e.includes('Warning:') && !e.includes('DevTools'),
    );
    expect(realErrors).toHaveLength(0);
  });
});
