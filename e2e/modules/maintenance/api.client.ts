import { BaseApiClient } from '../../shared/helpers/base-api-client';

/**
 * Maintenance module API client.
 * Extends BaseApiClient with all maintenance-specific endpoints.
 */
export class MaintenanceApiClient extends BaseApiClient {
  // ── Assets ─────────────────────────────────────
  async listAssets(params?: Record<string, string>) {
    return this.get('/maintenance/assets', params);
  }

  async createAsset(data: Record<string, unknown>) {
    return this.post('/maintenance/assets', data);
  }

  async getAsset(id: string) {
    return this.get(`/maintenance/assets/${id}`);
  }

  // ── Work Requests ──────────────────────────────
  async listWorkRequests(params?: Record<string, string>) {
    return this.get('/maintenance/work-requests', params);
  }

  async createWorkRequest(data: Record<string, unknown>) {
    return this.post('/maintenance/work-requests', data);
  }

  async getWorkRequest(id: string) {
    return this.get(`/maintenance/work-requests/${id}`);
  }

  async triageWorkRequest(id: string, data: Record<string, unknown>) {
    return this.post(`/maintenance/work-requests/${id}/triage`, data);
  }

  async approveWorkRequest(id: string) {
    return this.post(`/maintenance/work-requests/${id}/approve`);
  }

  async rejectWorkRequest(id: string, data: Record<string, unknown>) {
    return this.post(`/maintenance/work-requests/${id}/reject`, data);
  }

  async convertWorkRequest(id: string) {
    return this.post(`/maintenance/work-requests/${id}/convert`);
  }

  // ── Work Orders ────────────────────────────────
  async listWorkOrders(params?: Record<string, string>) {
    return this.get('/maintenance/work-orders', params);
  }

  async createWorkOrder(data: Record<string, unknown>) {
    return this.post('/maintenance/work-orders', data);
  }

  async getWorkOrder(id: string) {
    return this.get(`/maintenance/work-orders/${id}`);
  }

  async approveWorkOrder(id: string, data?: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/approve`, data);
  }

  async assignWorkOrder(id: string, data: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/assign`, data);
  }

  async acknowledgeWorkOrder(id: string) {
    return this.post(`/maintenance/work-orders/${id}/acknowledge`);
  }

  async startWorkOrder(id: string) {
    return this.post(`/maintenance/work-orders/${id}/start`);
  }

  async holdWorkOrder(id: string, data: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/hold`, data);
  }

  async resumeWorkOrder(id: string) {
    return this.post(`/maintenance/work-orders/${id}/resume`);
  }

  async completeWorkOrder(id: string, data?: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/complete`, data);
  }

  async closeWorkOrder(id: string, data?: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/close`, data);
  }

  async cancelWorkOrder(id: string, data?: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/cancel`, data);
  }

  async reopenWorkOrder(id: string, data: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/reopen`, data);
  }

  async rejectWorkOrder(id: string, data: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/reject`, data);
  }

  async declineWorkOrder(id: string, data: Record<string, unknown>) {
    return this.post(`/maintenance/work-orders/${id}/decline`, data);
  }

  async getWOBoard(params?: Record<string, string>) {
    return this.get('/maintenance/work-orders/board', params);
  }

  // ── PM Schedules ───────────────────────────────
  async listPMSchedules(params?: Record<string, string>) {
    return this.get('/maintenance/pm-schedules', params);
  }

  async createPMSchedule(data: Record<string, unknown>) {
    return this.post('/maintenance/pm-schedules', data);
  }

  // ── Config ─────────────────────────────────────
  async listFailureCodeSets(params?: Record<string, string>) {
    return this.get('/maintenance/failure-code-sets', params);
  }

  async listStrategies(params?: Record<string, string>) {
    return this.get('/maintenance/strategies', params);
  }

  async listJobPlans(params?: Record<string, string>) {
    return this.get('/maintenance/job-plans', params);
  }

  async listChecklistTemplates(params?: Record<string, string>) {
    return this.get('/maintenance/checklist-templates', params);
  }

  async getMaintenanceConfig() {
    return this.get('/maintenance/config');
  }

  // ── Breakdown & Downtime ───────────────────────
  async logBreakdown(data: Record<string, unknown>) {
    return this.post('/maintenance/breakdowns', data);
  }

  async listBreakdowns(params?: Record<string, string>) {
    return this.get('/maintenance/breakdowns', params);
  }

  async listDowntime(params?: Record<string, string>) {
    return this.get('/maintenance/downtime', params);
  }

  // ── Dashboard ──────────────────────────────────
  async getDashboard(role: 'manager' | 'planner' | 'technician' | 'plant-head' | 'finance' = 'manager') {
    return this.get(`/maintenance/dashboard/${role}`);
  }
}
