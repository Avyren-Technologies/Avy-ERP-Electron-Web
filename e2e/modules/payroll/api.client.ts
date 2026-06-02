import { BaseApiClient } from '../../shared/helpers/base-api-client';

/**
 * Payroll module API client.
 * Extends BaseApiClient with all payroll-specific endpoints.
 */
export class PayrollApiClient extends BaseApiClient {
  // ── Payroll Runs ───────────────────────────────
  async listPayrollRuns(params?: Record<string, string>) {
    return this.get('/hr/payroll-runs', params);
  }

  async createPayrollRun(data: { month: number; year: number }) {
    return this.post('/hr/payroll-runs', data as any);
  }

  async getPayrollRun(id: string) {
    return this.get(`/hr/payroll-runs/${id}`);
  }

  async deletePayrollRun(id: string) {
    return this.delete(`/hr/payroll-runs/${id}`);
  }

  // ── 6-Step Wizard ──────────────────────────────
  async lockAttendance(id: string) {
    return this.patch(`/hr/payroll-runs/${id}/lock-attendance`);
  }

  async reviewExceptions(id: string) {
    return this.patch(`/hr/payroll-runs/${id}/review-exceptions`);
  }

  async computeSalaries(id: string) {
    return this.patch(`/hr/payroll-runs/${id}/compute`);
  }

  async computeStatutory(id: string) {
    return this.patch(`/hr/payroll-runs/${id}/statutory`);
  }

  async approveRun(id: string) {
    return this.patch(`/hr/payroll-runs/${id}/approve`);
  }

  async disburseRun(id: string) {
    return this.patch(`/hr/payroll-runs/${id}/disburse`);
  }

  async resetToCompute(id: string) {
    return this.patch(`/hr/payroll-runs/${id}/reset-compute`);
  }

  // ── Summaries ──────────────────────────────────
  async getAttendanceSummary(id: string) {
    return this.get(`/hr/payroll-runs/${id}/attendance-summary`);
  }

  async getComputeSummary(id: string) {
    return this.get(`/hr/payroll-runs/${id}/compute-summary`);
  }

  async getStatutorySummary(id: string) {
    return this.get(`/hr/payroll-runs/${id}/statutory-summary`);
  }

  async getApprovalSummary(id: string) {
    return this.get(`/hr/payroll-runs/${id}/approval-summary`);
  }

  // ── Entries ────────────────────────────────────
  async listEntries(runId: string) {
    return this.get(`/hr/payroll-runs/${runId}/entries`);
  }

  // ── Config ─────────────────────────────────────
  async listSalaryComponents() {
    return this.get('/hr/salary-components');
  }

  async listSalaryStructures() {
    return this.get('/hr/salary-structures');
  }

  async listEmployeeSalaries() {
    return this.get('/hr/employee-salaries');
  }

  // ── Adjustments ────────────────────────────────
  async createAdjustment(data: Record<string, unknown>) {
    return this.post('/hr/payroll-adjustments', data);
  }

  async listAdjustments(params?: Record<string, string>) {
    return this.get('/hr/payroll-adjustments', params);
  }

  // ── Reports ────────────────────────────────────
  async getCostTrend() {
    return this.get('/hr/payroll-reports/cost-trend');
  }

  async getDepartmentReport(params: Record<string, string>) {
    return this.get('/hr/payroll-reports/department', params);
  }
}
