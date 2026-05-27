import { test, expect } from '../fixture';

test.describe('Inventory Analytics & Search', () => {
  test.describe.configure({ mode: 'serial' });

  // ── Analytics ────────────────────────────────

  test('should get current KPIs', async ({ api }) => {
    const res = await api.getCurrentKpis();
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('inventoryTurnover');
    expect(res.data).toHaveProperty('fillRate');
    expect(res.data).toHaveProperty('stockAccuracy');
  });

  test('should get daily analytics', async ({ api }) => {
    const res = await api.getDailyAnalytics({ startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(res.success).toBe(true);
  });

  test('should get KPI snapshots', async ({ api }) => {
    const res = await api.getKpiSnapshots({ year: '2026' });
    expect(res.success).toBe(true);
  });

  test('should get stock value by warehouse', async ({ api }) => {
    const res = await api.getStockValueByWarehouse();
    expect(res.success).toBe(true);
  });

  test('should get trend data', async ({ api }) => {
    const res = await api.getTrendData({ metric: 'receiptCount', period: 'daily', range: '30' });
    expect(res.success).toBe(true);
  });

  // ── Search ───────────────────────────────────

  test('should perform global search', async ({ api }) => {
    const res = await api.globalSearch({ q: 'test' });
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('results');
  });

  test('should search with entity filter', async ({ api }) => {
    const res = await api.globalSearch({ q: 'WH', entityTypes: 'warehouse' });
    expect(res.success).toBe(true);
  });

  // ── Saved Filters ───────────────────────────

  test('should create a saved filter', async ({ api }) => {
    const res = await api.createSavedFilter({
      screenName: 'stock-explorer',
      filterName: 'Test Filter',
      filterConfig: { warehouseId: 'test', status: 'AVAILABLE' },
    });
    expect(res.success).toBe(true);
  });

  test('should list saved filters', async ({ api }) => {
    const res = await api.listSavedFilters({ screenName: 'stock-explorer' });
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  // ── Export Templates ────────────────────────

  test('should get export templates', async ({ api }) => {
    const res = await api.getExportTemplates();
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });
});
