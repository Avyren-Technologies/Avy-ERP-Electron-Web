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

  // ── Phase A: Configuration Status ─────────────
  async getConfigurationStatus() {
    return this.get('/hr/payroll/configuration-status');
  }

  // ── Phase B: Pre-Run Checklist ────────────────
  async getPreRunChecklist(runId: string) {
    return this.get(`/hr/payroll-runs/${runId}/pre-run-checklist`);
  }

  // ── Phase C: New Endpoints ────────────────────
  async getAttendanceDetail(runId: string, params?: Record<string, string>) {
    return this.get(`/hr/payroll-runs/${runId}/attendance-detail`, params);
  }

  async resolveException(runId: string, index: number, data: { action: string; note?: string }) {
    return this.patch(`/hr/payroll-runs/${runId}/exceptions/${index}/resolve`, data as any);
  }

  async getStatutoryFiles(runId: string) {
    return this.get(`/hr/payroll-runs/${runId}/statutory-files`);
  }

  async saveApprovalNotes(runId: string, data: { approvalNotes: string }) {
    return this.patch(`/hr/payroll-runs/${runId}/approval-notes`, data as any);
  }

  async getDisbursementBreakdown(runId: string) {
    return this.get(`/hr/payroll-runs/${runId}/disbursement-breakdown`);
  }

  async archiveRun(runId: string, data: Record<string, any>) {
    return this.post(`/hr/payroll-runs/${runId}/archive`, data as any);
  }

  // ── Phase D: Post-Run ─────────────────────────
  async getPostRunChecklist(runId: string) {
    return this.get(`/hr/payroll-runs/${runId}/post-run-checklist`);
  }

  async completePostRunActivity(runId: string, activityId: string, data?: Record<string, any>) {
    return this.patch(`/hr/payroll-runs/${runId}/post-run-checklist/${activityId}/complete`, (data ?? {}) as any);
  }

  async getPostRunInsights(runId: string) {
    return this.get(`/hr/payroll-runs/${runId}/post-run-insights`);
  }
}
