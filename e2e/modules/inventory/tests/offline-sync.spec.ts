import { test, expect } from '../fixture';

test.describe('Inventory Offline Sync', () => {
  test.describe.configure({ mode: 'serial' });

  test('should get sync stats', async ({ api }) => {
    const res = await api.getSyncStats();
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('pending');
    expect(res.data).toHaveProperty('synced');
    expect(res.data).toHaveProperty('conflicts');
    expect(res.data).toHaveProperty('failed');
  });

  test('should upload sync actions batch', async ({ api }) => {
    const res = await api.uploadSyncActions({
      actions: [{
        actionType: 'PUTAWAY_CONFIRM',
        payload: { binId: 'test-bin', partId: 'test-part', quantity: 10 },
        capturedAt: new Date().toISOString(),
        deviceId: 'test-device-001',
      }],
    });
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('synced');
    expect(res.data).toHaveProperty('conflicts');
    expect(res.data).toHaveProperty('failed');
  });

  test('should list sync conflicts', async ({ api }) => {
    const res = await api.getSyncConflicts();
    expect(res.success).toBe(true);
  });

  test('should retry failed sync entries', async ({ api }) => {
    const res = await api.retrySyncFailed();
    expect(res.success).toBe(true);
  });

  test('should handle duplicate sync upload (idempotency)', async ({ api }) => {
    const action = {
      actionType: 'COUNT_ENTRY',
      payload: { binId: 'test-bin', partId: 'test-part', physicalQty: 50 },
      capturedAt: new Date().toISOString(),
      deviceId: 'test-device-002',
    };
    const res1 = await api.uploadSyncActions({ actions: [action] });
    const res2 = await api.uploadSyncActions({ actions: [action] });
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
  });

  test('should handle empty actions array', async ({ api }) => {
    // Empty arrays should be rejected by validation
    const res = await api.uploadSyncActions({ actions: [] });
    expect(res.success).toBe(false);
  });
});
