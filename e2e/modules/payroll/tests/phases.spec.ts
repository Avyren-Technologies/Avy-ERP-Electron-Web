import { test, expect } from '../fixture';

/**
 * Payroll Phases — API Integration Tests
 *
 * Tests the new Phase A (Configuration Prerequisites), Phase B (Pre-Run Checklist),
 * and Phase D (Post-Run) endpoints.
 */

test.describe('Phase A — Configuration Prerequisites', () => {
  test('GET /hr/payroll/configuration-status — returns 11 steps with status', async ({ api }) => {
    const body = await api.getConfigurationStatus();
    expect(body.success).toBe(true);

    const data = body.data;
    expect(data.totalCount).toBe(11);
    expect(typeof data.completedCount).toBe('number');
    expect(data.completedCount).toBeGreaterThanOrEqual(0);
    expect(data.completedCount).toBeLessThanOrEqual(11);
    expect(typeof data.estimatedMinutesRemaining).toBe('number');
    expect(Array.isArray(data.steps)).toBe(true);
    expect(data.steps.length).toBe(11);
  });

  test('Each step has required fields', async ({ api }) => {
    const body = await api.getConfigurationStatus();
    const steps = body.data.steps;

    for (const step of steps) {
      expect(step).toHaveProperty('id');
      expect(step).toHaveProperty('stepNumber');
      expect(step).toHaveProperty('name');
      expect(step).toHaveProperty('description');
      expect(step).toHaveProperty('status');
      expect(step).toHaveProperty('actionUrl');
      expect(['COMPLETE', 'IN_PROGRESS', 'NOT_STARTED']).toContain(step.status);
      expect(typeof step.stepNumber).toBe('number');
      expect(step.stepNumber).toBeGreaterThanOrEqual(1);
      expect(step.stepNumber).toBeLessThanOrEqual(11);
    }
  });

  test('Step numbers are sequential 1-11', async ({ api }) => {
    const body = await api.getConfigurationStatus();
    const steps = body.data.steps;
    const numbers = steps.map((s: any) => s.stepNumber);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  test('completedCount matches count of COMPLETE steps', async ({ api }) => {
    const body = await api.getConfigurationStatus();
    const data = body.data;
    const completeSteps = data.steps.filter((s: any) => s.status === 'COMPLETE').length;
    expect(data.completedCount).toBe(completeSteps);
  });
});

test.describe('Phase B — Pre-Run Checklist', () => {
  let runId: string;

  test.beforeAll(async ({ api }) => {
    // Use a unique month for this test suite
    const month = 11;
    const year = 2028;
    try {
      const createBody = await api.createPayrollRun({ month, year });
      runId = createBody.data.id;
    } catch {
      // Run may already exist — fetch it
      const listBody = await api.listPayrollRuns({ month: String(month), year: String(year) });
      const existing = listBody.data?.find((r: any) => r.month === month && r.year === year);
      if (existing) {
        runId = existing.id;
      }
    }
  });

  test('GET /hr/payroll-runs/:id/pre-run-checklist — returns 10 activities', async ({ api }) => {
    if (!runId) test.skip();

    const body = await api.getPreRunChecklist(runId);
    expect(body.success).toBe(true);

    const data = body.data;
    expect(data.totalCount).toBe(10);
    expect(typeof data.completedCount).toBe('number');
    expect(Array.isArray(data.activities)).toBe(true);
    expect(data.activities.length).toBe(10);
  });

  test('Each activity has required fields', async ({ api }) => {
    if (!runId) test.skip();

    const body = await api.getPreRunChecklist(runId);
    const activities = body.data.activities;

    for (const act of activities) {
      expect(act).toHaveProperty('id');
      expect(act).toHaveProperty('activityNumber');
      expect(act).toHaveProperty('name');
      expect(act).toHaveProperty('description');
      expect(act).toHaveProperty('status');
      expect(act).toHaveProperty('priority');
      expect(['COMPLETE', 'PENDING', 'IN_PROGRESS', 'BLOCKED']).toContain(act.status);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(act.priority);
    }
  });

  test('keyStats are returned with employee counts', async ({ api }) => {
    if (!runId) test.skip();

    const body = await api.getPreRunChecklist(runId);
    const keyStats = body.data.keyStats;

    expect(keyStats).toHaveProperty('totalEmployees');
    expect(keyStats).toHaveProperty('totalMonthlyCTC');
    expect(keyStats).toHaveProperty('newJoiners');
    expect(keyStats).toHaveProperty('exits');
    expect(typeof keyStats.totalEmployees).toBe('number');
    expect(typeof keyStats.totalMonthlyCTC).toBe('number');
  });

  test('run info is returned', async ({ api }) => {
    if (!runId) test.skip();

    const body = await api.getPreRunChecklist(runId);
    const run = body.data.run;

    expect(run).toHaveProperty('id');
    expect(run).toHaveProperty('month');
    expect(run).toHaveProperty('year');
    expect(run).toHaveProperty('status');
    expect(run.id).toBe(runId);
  });

  test.afterAll(async ({ api }) => {
    if (runId) {
      try { await api.deletePayrollRun(runId); } catch { /* ok */ }
    }
  });
});

test.describe('Phase C — New Enrichment Endpoints', () => {
  let runId: string;

  test.beforeAll(async ({ api }) => {
    const month = 10;
    const year = 2028;
    try {
      const createBody = await api.createPayrollRun({ month, year });
      runId = createBody.data.id;
    } catch {
      const listBody = await api.listPayrollRuns({ month: String(month), year: String(year) });
      const existing = listBody.data?.find((r: any) => r.month === month && r.year === year);
      if (existing) runId = existing.id;
    }
  });

  test('GET attendance-detail — returns paginated employee attendance', async ({ api }) => {
    if (!runId) test.skip();

    const body = await api.getAttendanceDetail(runId);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('employees');
    expect(body.data).toHaveProperty('total');
    expect(body.data).toHaveProperty('page');
    expect(body.data).toHaveProperty('limit');
    expect(body.data).toHaveProperty('overrideSummary');
    expect(body.data).toHaveProperty('vsLastMonth');
    expect(Array.isArray(body.data.employees)).toBe(true);
  });

  test('GET statutory-files — returns 4 filing types with compliance meter', async ({ api }) => {
    if (!runId) test.skip();

    const body = await api.getStatutoryFiles(runId);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('files');
    expect(body.data).toHaveProperty('complianceMeter');
    expect(body.data.files.length).toBe(4);

    for (const file of body.data.files) {
      expect(file).toHaveProperty('type');
      expect(file).toHaveProperty('label');
      expect(file).toHaveProperty('status');
      expect(file).toHaveProperty('dueDate');
      expect(file).toHaveProperty('employeeCount');
    }

    const meter = body.data.complianceMeter;
    expect(typeof meter.score).toBe('number');
    expect(['COMPLIANT', 'PARTIAL', 'NON_COMPLIANT']).toContain(meter.status);
  });

  test('PATCH approval-notes — saves notes', async ({ api }) => {
    if (!runId) test.skip();

    const body = await api.saveApprovalNotes(runId, { approvalNotes: 'Test approval note from E2E' });
    expect(body.success).toBe(true);
    expect(body.data.approvalNotes).toBe('Test approval note from E2E');
  });

  test('GET disbursement-breakdown — returns payment method breakdown', async ({ api }) => {
    if (!runId) test.skip();

    const body = await api.getDisbursementBreakdown(runId);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('valueBreakdown');
    expect(body.data).toHaveProperty('distributionStatus');
    expect(body.data).toHaveProperty('totals');
    expect(body.data).toHaveProperty('payrollLock');
    expect(Array.isArray(body.data.valueBreakdown)).toBe(true);
  });

  test.afterAll(async ({ api }) => {
    if (runId) {
      try { await api.deletePayrollRun(runId); } catch { /* ok */ }
    }
  });
});
