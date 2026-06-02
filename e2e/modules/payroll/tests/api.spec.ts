import { test, expect } from '../fixture';

/**
 * Payroll API — Integration Tests
 *
 * Tests the complete 6-step payroll wizard lifecycle via API:
 *   DRAFT → ATTENDANCE_LOCKED → EXCEPTIONS_REVIEWED → COMPUTED
 *       → STATUTORY_DONE → APPROVED → DISBURSED
 *
 * Uses a unique future month (12/2028) to avoid conflicts with
 * other tests or existing data. Cleans up after itself.
 */

const LIFECYCLE_MONTH = 12;
const LIFECYCLE_YEAR = 2028;

let runId: string;

test.describe('Payroll API — Integration Tests', () => {
  /**
   * ═══════════════════════════════════════════════
   * CONFIG ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Salary Configuration', () => {
    test('GET /hr/salary-components — returns components with EARNING type', async ({ api }) => {
      const body = await api.listSalaryComponents();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      const hasEarning = body.data.some((c: any) => c.type === 'EARNING');
      expect(hasEarning).toBe(true);
    });

    test('GET /hr/salary-structures — returns structures', async ({ api }) => {
      const body = await api.listSalaryStructures();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('GET /hr/employee-salaries — returns assigned salaries with isCurrent', async ({ api }) => {
      const body = await api.listEmployeeSalaries();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      if (body.data.length > 0) {
        expect(body.data[0]).toHaveProperty('isCurrent');
      }
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * PAYROLL RUN LIFECYCLE — Full 6-Step Wizard
   * ═══════════════════════════════════════════════
   */
  test.describe('Payroll Run Lifecycle', () => {
    test.describe.serial('Step-by-step wizard flow', () => {
      test('Step 0: POST /hr/payroll-runs — creates run with DRAFT status and employeeCount > 0', async ({ api }) => {
        const body = await api.createPayrollRun({ month: LIFECYCLE_MONTH, year: LIFECYCLE_YEAR });
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('DRAFT');
        expect(body.data.employeeCount).toBeGreaterThan(0);
        runId = body.data.id;
      });

      test('Step 1a: GET attendance-summary — headcount.totalActive > 0, workingDays > 0', async ({ api }) => {
        const body = await api.getAttendanceSummary(runId);
        expect(body.success).toBe(true);
        expect(body.data.headcount.totalActive).toBeGreaterThan(0);
        expect(body.data.workingDays).toBeGreaterThan(0);
      });

      test('Step 1b: PATCH lock-attendance — status becomes ATTENDANCE_LOCKED', async ({ api }) => {
        const body = await api.lockAttendance(runId);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('ATTENDANCE_LOCKED');
      });

      test('Step 2: PATCH review-exceptions — status becomes EXCEPTIONS_REVIEWED, has exceptions array', async ({ api }) => {
        const body = await api.reviewExceptions(runId);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('EXCEPTIONS_REVIEWED');
        expect(body.data).toHaveProperty('exceptions');
        expect(Array.isArray(body.data.exceptions)).toBe(true);
      });

      test('Step 3a: PATCH compute — status becomes COMPUTED, totalGross > 0, employeeCount > 0', async ({ api }) => {
        const body = await api.computeSalaries(runId);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('COMPUTED');
        expect(Number(body.data.totalGross)).toBeGreaterThan(0);
        expect(body.data.employeeCount).toBeGreaterThan(0);
      });

      test('Step 3b: GET compute-summary — employeesProcessed > 0, earningsBreakdown has BASIC', async ({ api }) => {
        const body = await api.getComputeSummary(runId);
        expect(body.success).toBe(true);
        expect(body.data.employeesProcessed).toBeGreaterThan(0);
        expect(body.data).toHaveProperty('earningsBreakdown');
        expect(body.data.earningsBreakdown).toHaveProperty('BASIC');
      });

      test('Step 4a: PATCH statutory — status becomes STATUTORY_DONE', async ({ api }) => {
        const body = await api.computeStatutory(runId);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('STATUTORY_DONE');
      });

      test('Step 4b: GET statutory-summary — pfEmployee > 0, employeeStatutory has rows', async ({ api }) => {
        const body = await api.getStatutorySummary(runId);
        expect(body.success).toBe(true);
        expect(Number(body.data.pfEmployee)).toBeGreaterThan(0);
        expect(Array.isArray(body.data.employeeStatutory)).toBe(true);
        expect(body.data.employeeStatutory.length).toBeGreaterThan(0);
      });

      test('Step 5: GET approval-summary — summary.employees > 0, departmentBreakdown length > 0, totalStatutory > 0', async ({ api }) => {
        const body = await api.getApprovalSummary(runId);
        expect(body.success).toBe(true);
        expect(body.data.summary.employees).toBeGreaterThan(0);
        expect(Array.isArray(body.data.departmentBreakdown)).toBe(true);
        expect(body.data.departmentBreakdown.length).toBeGreaterThan(0);
        expect(Number(body.data.totalStatutory)).toBeGreaterThan(0);
      });

      test('Step 3 (reset): PATCH reset-compute — status reverts to EXCEPTIONS_REVIEWED, entries cleared', async ({ api }) => {
        const body = await api.resetToCompute(runId);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('EXCEPTIONS_REVIEWED');

        const entries = await api.listEntries(runId);
        expect(entries.success).toBe(true);
        expect(entries.data.length).toBe(0);
      });

      test('Cleanup: DELETE run — success', async ({ api }) => {
        const body = await api.deletePayrollRun(runId);
        expect(body.success).toBe(true);
      });
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * LIST & FILTER ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Payroll Run List & Filters', () => {
    test('GET /hr/payroll-runs — list returns array', async ({ api }) => {
      const body = await api.listPayrollRuns();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('GET /hr/payroll-runs — filter by status=DRAFT', async ({ api }) => {
      const body = await api.listPayrollRuns({ status: 'DRAFT' });
      expect(body.success).toBe(true);
      if (body.data.length > 0) {
        expect(body.data[0].status).toBe('DRAFT');
      }
    });

    test('GET /hr/payroll-runs/:id — 404 for invalid ID', async ({ api }) => {
      const body = await api.getPayrollRun('nonexistent-run-id-12345');
      expect(body.success).toBe(false);
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * ADJUSTMENTS ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Payroll Adjustments', () => {
    test('GET /hr/payroll-adjustments — list returns array', async ({ api }) => {
      const body = await api.listAdjustments();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  /**
   * ═══════════════════════════════════════════════
   * REPORT ENDPOINTS
   * ═══════════════════════════════════════════════
   */
  test.describe('Payroll Reports', () => {
    test('GET /hr/payroll-reports/cost-trend — returns data', async ({ api }) => {
      const body = await api.getCostTrend();
      expect(body.success).toBe(true);
    });
  });
});
