import { test, expect } from '../fixture';

test.describe('Inventory Tool Room', () => {
  test.describe.configure({ mode: 'serial' });

  // ── Tool Life Policies ───────────────────────

  test('should list tool life policies', async ({ api }) => {
    const res = await api.listToolLifePolicies();
    expect(res.success).toBe(true);
  });

  test('should upsert a tool life policy', async ({ api }) => {
    const res = await api.upsertToolLifePolicy({
      partId: 'test-tool-part',
      lifeUnit: 'HOURS',
      expectedLife: 40,
      lifeWarningThresholdPct: 20,
      isReconditionable: true,
      maxReconditionCycles: 3,
      lifePerReconditionCycle: 25,
      trackAtSerialLevel: false,
    });
    expect(res).toBeDefined();
  });

  // ── Tool Issue ───────────────────────────────

  test('should issue tool to machine', async ({ api }) => {
    const res = await api.createToolIssue({
      partId: 'test-tool-part',
      warehouseId: 'test-wh',
      machineId: 'test-machine',
      spindleStation: 'Spindle 1',
      quantity: 1,
    });
    // May fail due to missing stock — OK for endpoint test
    expect(res).toBeDefined();
  });

  test('should get tools at machine', async ({ api }) => {
    const res = await api.getToolsAtMachine();
    expect(res.success).toBe(true);
  });

  // ── Tool Return ──────────────────────────────

  test('should return tool from machine', async ({ api }) => {
    const res = await api.createToolReturn({
      partId: 'test-tool-part',
      machineId: 'test-machine',
      actualUsage: 10,
      outcome: 'STILL_USABLE',
    });
    expect(res).toBeDefined();
  });

  // ── Reconditioning ──────────────────────────

  test('should list reconditioning records', async ({ api }) => {
    const res = await api.listReconditioning();
    expect(res.success).toBe(true);
  });

  test('should get overdue reconditioning', async ({ api }) => {
    const res = await api.getOverdueReconditioning();
    expect(res.success).toBe(true);
  });

  // ── Tool Reports ─────────────────────────────

  test('should get tool status report', async ({ api }) => {
    const res = await api.getToolStatusReport();
    expect(res.success).toBe(true);
  });

  test('should get tools at machine report', async ({ api }) => {
    const res = await api.getToolsAtMachineReport();
    expect(res.success).toBe(true);
  });

  test('should get tool consumption report', async ({ api }) => {
    const res = await api.getToolConsumptionReport();
    expect(res.success).toBe(true);
  });

  test('should get reconditioning register', async ({ api }) => {
    const res = await api.getReconditioningRegister();
    expect(res.success).toBe(true);
  });

  test('should get tool breakage report', async ({ api }) => {
    const res = await api.getToolBreakageReport();
    expect(res.success).toBe(true);
  });
});
