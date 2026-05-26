import { test, expect } from '../fixture';

/**
 * Ensure number series exist for maintenance screens.
 * Idempotent — skips if they already exist.
 */
async function ensureNumberSeries(api: any) {
  const screens = [
    { code: 'MA', linkedScreen: 'Maintenance Asset', prefix: 'MA-' },
    { code: 'WO', linkedScreen: 'Work Order', prefix: 'WO-' },
    { code: 'WR', linkedScreen: 'Work Request', prefix: 'WR-' },
  ];

  // Check existing
  const existing = await api.get('/company/no-series');
  const existingScreens = new Set(
    (existing?.data ?? []).map((ns: any) => ns.linkedScreen),
  );

  for (const screen of screens) {
    if (existingScreens.has(screen.linkedScreen)) continue;
    const res = await api.post('/company/no-series', {
      code: screen.code,
      linkedScreen: screen.linkedScreen,
      prefix: screen.prefix,
      startNumber: 1,
      numberCount: 5,
    });
    // Ignore duplicates — another test may have created it
    if (!res.success && !res.message?.includes('already exists')) {
      console.warn(`Number series setup warning for ${screen.linkedScreen}: ${res.message}`);
    }
  }
}

/**
 * Helper: get the first asset ID, or auto-create one if none exist.
 */
async function getOrCreateAssetId(api: any): Promise<string> {
  const assets = await api.listAssets();
  expect(assets.success).toBe(true);
  if (assets.data.length > 0) {
    return assets.data[0].id;
  }

  // Ensure number series are configured first
  await ensureNumberSeries(api);

  // Create a test asset
  const create = await api.createAsset({
    name: 'E2E Test Asset',
    assetClass: 'MACHINE',
    criticality: 'MEDIUM',
    ownership: 'OWNED',
  });
  if (!create.success) {
    throw new Error(`Asset creation failed: ${create.message || JSON.stringify(create)}`);
  }
  return create.data.id;
}

test.describe('Maintenance API — Integration Tests', () => {
  /**
   * ═══════════════════════════════════════════════
   * ASSET ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Assets', () => {
    test('GET /maintenance/assets — list assets', async ({ api }) => {
      const body = await api.listAssets();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      if (body.meta) {
        expect(body.meta).toHaveProperty('total');
        expect(body.meta).toHaveProperty('page');
      }
    });

    test('GET /maintenance/assets — search filter', async ({ api }) => {
      const body = await api.listAssets({ search: 'test-nonexistent-xyz' });
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('GET /maintenance/assets/:id — 404 for invalid ID', async ({ api }) => {
      const body = await api.getAsset('nonexistent-id-12345');
      expect(body.success).toBe(false);
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * WORK REQUEST ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Work Requests', () => {
    test('GET /maintenance/work-requests — list', async ({ api }) => {
      const body = await api.listWorkRequests();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('GET /maintenance/work-requests — filter by status', async ({ api }) => {
      const body = await api.listWorkRequests({ status: 'SUBMITTED' });
      expect(body.success).toBe(true);
      if (body.data.length > 0) {
        expect(body.data[0].status).toBe('SUBMITTED');
      }
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * WORK ORDER ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Work Orders', () => {
    test('GET /maintenance/work-orders — list', async ({ api }) => {
      const body = await api.listWorkOrders();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('GET /maintenance/work-orders — filter by status', async ({ api }) => {
      const body = await api.listWorkOrders({ status: 'DRAFT' });
      expect(body.success).toBe(true);
      if (body.data.length > 0) {
        expect(body.data[0].status).toBe('DRAFT');
      }
    });

    test('GET /maintenance/work-orders — filter by priority', async ({ api }) => {
      const body = await api.listWorkOrders({ priority: 'HIGH' });
      expect(body.success).toBe(true);
      if (body.data.length > 0) {
        expect(body.data[0].priority).toBe('HIGH');
      }
    });

    test('GET /maintenance/work-orders/board — board view', async ({ api }) => {
      const body = await api.getWOBoard();
      expect(body.success).toBe(true);
    });

    test('GET /maintenance/work-orders/:id — 404 for invalid ID', async ({ api }) => {
      const body = await api.getWorkOrder('nonexistent-id-12345');
      expect(body.success).toBe(false);
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * WORK ORDER LIFECYCLE — Full State Machine
   * Single test that walks through every transition.
   * ═══════════════════════════════════════════════
   */
  test('WO Lifecycle: DRAFT → APPROVED → ASSIGNED → ACK → IN_PROGRESS → ON_HOLD → IN_PROGRESS → COMPLETED → CLOSED', async ({ api }) => {
    const assetId = await getOrCreateAssetId(api);

    // 1. Create (→ DRAFT)
    const create = await api.createWorkOrder({ assetId, woType: 'CORRECTIVE', priority: 'MEDIUM' });
    expect(create.success).toBe(true);
    expect(create.data.status).toBe('DRAFT');
    expect(create.data.woNumber).toBeTruthy();
    const woId = create.data.id;

    // 2. Approve (DRAFT → APPROVED)
    const approve = await api.approveWorkOrder(woId);
    expect(approve.success).toBe(true);
    expect(approve.data.status).toBe('APPROVED');

    // 2b. Cannot approve again
    const approveAgain = await api.approveWorkOrder(woId);
    expect(approveAgain.success).toBe(false);

    // 3. Assign (APPROVED → ASSIGNED)
    const empRes = await api.get('/hr/employees?limit=1');
    const techId = empRes.success && empRes.data?.length > 0 ? empRes.data[0].id : 'e2e-test-tech';
    const assign = await api.assignWorkOrder(woId, { leadTechnicianId: techId });
    expect(assign.success).toBe(true);
    expect(assign.data.status).toBe('ASSIGNED');

    // 4. Acknowledge (ASSIGNED → ACKNOWLEDGED)
    const ack = await api.acknowledgeWorkOrder(woId);
    expect(ack.success).toBe(true);
    expect(ack.data.status).toBe('ACKNOWLEDGED');

    // 5. Start (ACKNOWLEDGED → IN_PROGRESS)
    const start = await api.startWorkOrder(woId);
    expect(start.success).toBe(true);
    expect(start.data.status).toBe('IN_PROGRESS');

    // 6. Hold (IN_PROGRESS → ON_HOLD)
    const hold = await api.holdWorkOrder(woId, { holdReason: 'WAITING_PARTS' });
    expect(hold.success).toBe(true);
    expect(hold.data.status).toBe('ON_HOLD');

    // 7. Resume (ON_HOLD → IN_PROGRESS)
    const resume = await api.resumeWorkOrder(woId);
    expect(resume.success).toBe(true);
    expect(resume.data.status).toBe('IN_PROGRESS');

    // 8. Complete (IN_PROGRESS → COMPLETED)
    const complete = await api.completeWorkOrder(woId, { observations: 'E2E lifecycle test' });
    expect(complete.success).toBe(true);
    expect(complete.data.status).toBe('COMPLETED');

    // 9. Close (COMPLETED → CLOSED)
    const close = await api.closeWorkOrder(woId);
    expect(close.success).toBe(true);
    expect(close.data.status).toBe('CLOSED');

    // 10. Verify final state
    const final = await api.getWorkOrder(woId);
    expect(final.success).toBe(true);
    expect(final.data.status).toBe('CLOSED');
    expect(final.data.actualEnd).toBeTruthy();
  });

  /**
   * ═══════════════════════════════════════════════
   * WO REJECTION FLOW
   * ═══════════════════════════════════════════════
   */
  test('WO Rejection: DRAFT → REJECTED', async ({ api }) => {
    const assetId = await getOrCreateAssetId(api);

    const create = await api.createWorkOrder({ assetId, woType: 'INSPECTION', priority: 'LOW' });
    expect(create.success).toBe(true);

    const reject = await api.rejectWorkOrder(create.data.id, { reason: 'E2E test rejection' });
    expect(reject.success).toBe(true);
    expect(reject.data.status).toBe('REJECTED');
  });

  /**
   * ═══════════════════════════════════════════════
   * WO CANCEL FLOW
   * ═══════════════════════════════════════════════
   */
  test('WO Cancel: DRAFT → CANCELLED', async ({ api }) => {
    const assetId = await getOrCreateAssetId(api);

    const create = await api.createWorkOrder({ assetId, woType: 'CORRECTIVE', priority: 'LOW' });
    expect(create.success).toBe(true);

    const cancel = await api.cancelWorkOrder(create.data.id);
    expect(cancel.success).toBe(true);
    expect(cancel.data.status).toBe('CANCELLED');
  });

  /**
   * ═══════════════════════════════════════════════
   * INVALID STATE TRANSITIONS
   * ═══════════════════════════════════════════════
   */
  test('Invalid transition: cannot start a DRAFT WO', async ({ api }) => {
    const assetId = await getOrCreateAssetId(api);

    const create = await api.createWorkOrder({ assetId, woType: 'CORRECTIVE', priority: 'MEDIUM' });
    expect(create.success).toBe(true);
    const woId = create.data.id;

    const start = await api.startWorkOrder(woId);
    expect(start.success).toBe(false);

    await api.cancelWorkOrder(woId);
  });

  test('Invalid transition: cannot assign a DRAFT WO', async ({ api }) => {
    const assetId = await getOrCreateAssetId(api);

    const create = await api.createWorkOrder({ assetId, woType: 'CORRECTIVE', priority: 'MEDIUM' });
    expect(create.success).toBe(true);
    const woId = create.data.id;

    const assign = await api.assignWorkOrder(woId, { leadTechnicianId: 'some-tech' });
    expect(assign.success).toBe(false);

    await api.cancelWorkOrder(woId);
  });

  test('Invalid transition: cannot close an IN_PROGRESS WO', async ({ api }) => {
    const assetId = await getOrCreateAssetId(api);

    const create = await api.createWorkOrder({ assetId, woType: 'CORRECTIVE', priority: 'MEDIUM' });
    expect(create.success).toBe(true);
    const woId = create.data.id;

    await api.approveWorkOrder(woId);
    const empRes = await api.get('/hr/employees?limit=1');
    const techId = empRes.success && empRes.data?.length > 0 ? empRes.data[0].id : 'e2e-test-tech';
    await api.assignWorkOrder(woId, { leadTechnicianId: techId });
    await api.startWorkOrder(woId);

    const close = await api.closeWorkOrder(woId);
    expect(close.success).toBe(false);

    // Cleanup — can't cancel IN_PROGRESS directly, so leave it
  });

  /**
   * ═══════════════════════════════════════════════
   * PM SCHEDULE ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('PM Schedules', () => {
    test('GET /maintenance/pm-schedules — list', async ({ api }) => {
      const body = await api.listPMSchedules();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * CONFIG ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Configuration', () => {
    test('GET /maintenance/failure-code-sets — list', async ({ api }) => {
      const body = await api.listFailureCodeSets();
      expect(body.success).toBe(true);
    });

    test('GET /maintenance/strategies — list', async ({ api }) => {
      const body = await api.listStrategies();
      expect(body.success).toBe(true);
    });

    test('GET /maintenance/job-plans — list', async ({ api }) => {
      const body = await api.listJobPlans();
      expect(body.success).toBe(true);
    });

    test('GET /maintenance/checklist-templates — list', async ({ api }) => {
      const body = await api.listChecklistTemplates();
      expect(body.success).toBe(true);
    });

    test('GET /maintenance/config — get config', async ({ api }) => {
      const body = await api.getMaintenanceConfig();
      expect(body.success).toBe(true);
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * BREAKDOWN & DOWNTIME ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Breakdowns & Downtime', () => {
    test('GET /maintenance/breakdowns — list', async ({ api }) => {
      const body = await api.listBreakdowns();
      expect(body.success).toBe(true);
    });

    test('GET /maintenance/downtime — list', async ({ api }) => {
      const body = await api.listDowntime();
      expect(body.success).toBe(true);
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * DASHBOARD ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Dashboard', () => {
    test('GET /maintenance/dashboard/manager — manager dashboard', async ({ api }) => {
      const body = await api.getDashboard('manager');
      expect(body.success).toBe(true);
    });

    test('GET /maintenance/dashboard/planner — planner dashboard', async ({ api }) => {
      const body = await api.getDashboard('planner');
      expect(body.success).toBe(true);
    });
  });
});
