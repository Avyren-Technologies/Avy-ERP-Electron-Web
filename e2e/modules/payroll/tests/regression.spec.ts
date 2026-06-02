import { test, expect } from '../fixture';

/**
 * Payroll Regression Tests
 *
 * Each test is self-contained: creates its own payroll run, exercises
 * the scenario under test, then deletes the run in cleanup.
 *
 * Uses unique future months to avoid test collisions.
 */

test.describe('Payroll Regression Tests', () => {
  test('REG-001: totalStatutory populated after statutory compute', async ({ api }) => {
    const run = await api.createPayrollRun({ month: 11, year: 2028 });
    expect(run.success).toBe(true);

    await api.lockAttendance(run.data.id);
    await api.reviewExceptions(run.data.id);
    await api.computeSalaries(run.data.id);
    await api.computeStatutory(run.data.id);

    const detail = await api.getPayrollRun(run.data.id);
    expect(detail.success).toBe(true);
    expect(Number(detail.data.totalStatutory)).toBeGreaterThan(0);

    await api.deletePayrollRun(run.data.id);
  });

  test('REG-002: employeeCount populated at creation', async ({ api }) => {
    const run = await api.createPayrollRun({ month: 10, year: 2028 });
    expect(run.success).toBe(true);
    expect(run.data.employeeCount).toBeGreaterThan(0);

    await api.deletePayrollRun(run.data.id);
  });

  test('REG-003: compute-summary earnings use component codes not CUIDs', async ({ api }) => {
    const run = await api.createPayrollRun({ month: 9, year: 2028 });
    expect(run.success).toBe(true);

    await api.lockAttendance(run.data.id);
    await api.reviewExceptions(run.data.id);
    await api.computeSalaries(run.data.id);

    const summary = await api.getComputeSummary(run.data.id);
    expect(summary.success).toBe(true);

    const keys = Object.keys(summary.data.earningsBreakdown);
    // Keys should be like BASIC, HRA, DA — not CUIDs (CUIDs are 25+ chars)
    for (const key of keys) {
      expect(key.length).toBeLessThan(30);
      expect(key).toMatch(/^[A-Z_]+$/); // Component codes are uppercase alpha + underscore
    }

    await api.deletePayrollRun(run.data.id);
  });

  test('REG-004: salary structure rejects non-EARNING components', async ({ api }) => {
    const components = await api.listSalaryComponents();
    expect(components.success).toBe(true);

    const deduction = components.data.find((c: any) => c.type === 'DEDUCTION');
    if (deduction) {
      const res = await api.post('/hr/salary-structures', {
        name: 'Test Invalid Structure',
        code: 'TEST-INV',
        components: [
          { componentId: deduction.id, calculationMethod: 'FIXED', value: 1000 },
        ],
      });
      expect(res.success).toBe(false);
    }
  });

  test('REG-005: non-disbursed run can be deleted', async ({ api }) => {
    const run = await api.createPayrollRun({ month: 8, year: 2028 });
    expect(run.success).toBe(true);

    await api.lockAttendance(run.data.id);

    const del = await api.deletePayrollRun(run.data.id);
    expect(del.success).toBe(true);
  });

  test('REG-006: re-compute resets status and clears entries', async ({ api }) => {
    const run = await api.createPayrollRun({ month: 7, year: 2028 });
    expect(run.success).toBe(true);

    await api.lockAttendance(run.data.id);
    await api.reviewExceptions(run.data.id);
    await api.computeSalaries(run.data.id);

    // Entries should exist after compute
    const entries1 = await api.listEntries(run.data.id);
    expect(entries1.success).toBe(true);
    expect(entries1.data.length).toBeGreaterThan(0);

    // Reset to compute
    await api.resetToCompute(run.data.id);

    // Status should revert, entries should be cleared
    const detail = await api.getPayrollRun(run.data.id);
    expect(detail.success).toBe(true);
    expect(detail.data.status).toBe('EXCEPTIONS_REVIEWED');

    const entries2 = await api.listEntries(run.data.id);
    expect(entries2.success).toBe(true);
    expect(entries2.data.length).toBe(0);

    await api.deletePayrollRun(run.data.id);
  });
});
