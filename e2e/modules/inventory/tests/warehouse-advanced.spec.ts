import { test, expect } from '../fixture';

test.describe('Inventory Warehouse Advanced', () => {
  test.describe.configure({ mode: 'serial' });

  let ruleId: string;
  let palletId: string;

  // ── Putaway Rules ────────────────────────────

  test('should create a putaway rule (FIXED_BIN)', async ({ api }) => {
    const warehouses = await api.listWarehouses();
    expect(warehouses.success).toBe(true);
    if (warehouses.data.length === 0) await api.seedInventoryData();

    const wh = (await api.listWarehouses()).data[0];
    const res = await api.createPutawayRule({
      ruleType: 'FIXED_BIN',
      warehouseId: wh.id,
      partId: 'test',
      priority: 1,
    });
    expect(res.success).toBe(true);
    ruleId = res.data.id;
  });

  test('should list putaway rules', async ({ api }) => {
    const res = await api.listPutawayRules();
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('should suggest bin based on rules', async ({ api }) => {
    const wh = (await api.listWarehouses()).data[0];
    const res = await api.suggestBin({ warehouseId: wh.id, partId: 'test' });
    expect(res).toBeDefined();
  });

  test('should delete putaway rule', async ({ api }) => {
    const res = await api.deletePutawayRule(ruleId);
    expect(res.success).toBe(true);
  });

  // ── Pallets ──────────────────────────────────

  test('should create a pallet', async ({ api }) => {
    const wh = (await api.listWarehouses()).data[0];
    const res = await api.createPallet({ warehouseId: wh.id });
    expect(res.success).toBe(true);
    palletId = res.data.id;
  });

  test('should list pallets', async ({ api }) => {
    const res = await api.listPallets();
    expect(res.success).toBe(true);
  });

  test('should get pallet with items', async ({ api }) => {
    const res = await api.getPallet(palletId);
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('items');
  });

  test('should close a pallet', async ({ api }) => {
    const res = await api.closePallet(palletId);
    expect(res.success).toBe(true);
  });

  // ── Staging ──────────────────────────────────

  test('should get inbound staging', async ({ api }) => {
    const res = await api.getStagingInbound();
    expect(res.success).toBe(true);
  });

  test('should get outbound staging', async ({ api }) => {
    const res = await api.getStagingOutbound();
    expect(res.success).toBe(true);
  });
});
