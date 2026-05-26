import { APIRequestContext } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3030/api/v1';

export class ApiClient {
  private token: string = '';

  constructor(private request: APIRequestContext) {}

  async login(email: string, password: string, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const res = await this.request.post(`${API_BASE}/auth/login`, {
        data: { email, password },
      });
      const body = await res.json();
      if (body.success) {
        this.token = body.data.tokens.accessToken;
        return body.data;
      }
      // Retry on session collision (DUPLICATE_ENTRY), fail immediately on bad credentials
      if (body.code === 'DUPLICATE_ENTRY' && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw new Error(`Login failed: ${body.message || body.error}`);
    }
    throw new Error('Login failed after retries');
  }

  private headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  // ── Maintenance Assets ─────────────────────────
  async listAssets(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/assets${qs}`, { headers: this.headers() });
    return res.json();
  }

  async createAsset(data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/assets`, { headers: this.headers(), data });
    return res.json();
  }

  async getAsset(id: string) {
    const res = await this.request.get(`${API_BASE}/maintenance/assets/${id}`, { headers: this.headers() });
    return res.json();
  }

  // ── Work Requests ──────────────────────────────
  async listWorkRequests(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/work-requests${qs}`, { headers: this.headers() });
    return res.json();
  }

  async createWorkRequest(data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-requests`, { headers: this.headers(), data });
    return res.json();
  }

  async getWorkRequest(id: string) {
    const res = await this.request.get(`${API_BASE}/maintenance/work-requests/${id}`, { headers: this.headers() });
    return res.json();
  }

  async triageWorkRequest(id: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-requests/${id}/triage`, { headers: this.headers(), data });
    return res.json();
  }

  async approveWorkRequest(id: string) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-requests/${id}/approve`, { headers: this.headers() });
    return res.json();
  }

  async rejectWorkRequest(id: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-requests/${id}/reject`, { headers: this.headers(), data });
    return res.json();
  }

  async convertWorkRequest(id: string) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-requests/${id}/convert`, { headers: this.headers() });
    return res.json();
  }

  // ── Work Orders ────────────────────────────────
  async listWorkOrders(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/work-orders${qs}`, { headers: this.headers() });
    return res.json();
  }

  async createWorkOrder(data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders`, { headers: this.headers(), data });
    return res.json();
  }

  async getWorkOrder(id: string) {
    const res = await this.request.get(`${API_BASE}/maintenance/work-orders/${id}`, { headers: this.headers() });
    return res.json();
  }

  async approveWorkOrder(id: string, data?: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/approve`, { headers: this.headers(), data });
    return res.json();
  }

  async assignWorkOrder(id: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/assign`, { headers: this.headers(), data });
    return res.json();
  }

  async acknowledgeWorkOrder(id: string) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/acknowledge`, { headers: this.headers() });
    return res.json();
  }

  async startWorkOrder(id: string) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/start`, { headers: this.headers() });
    return res.json();
  }

  async holdWorkOrder(id: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/hold`, { headers: this.headers(), data });
    return res.json();
  }

  async resumeWorkOrder(id: string) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/resume`, { headers: this.headers() });
    return res.json();
  }

  async completeWorkOrder(id: string, data?: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/complete`, { headers: this.headers(), data });
    return res.json();
  }

  async closeWorkOrder(id: string, data?: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/close`, { headers: this.headers(), data });
    return res.json();
  }

  async cancelWorkOrder(id: string, data?: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/cancel`, { headers: this.headers(), data });
    return res.json();
  }

  async reopenWorkOrder(id: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/reopen`, { headers: this.headers(), data });
    return res.json();
  }

  async rejectWorkOrder(id: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/reject`, { headers: this.headers(), data });
    return res.json();
  }

  async declineWorkOrder(id: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/work-orders/${id}/decline`, { headers: this.headers(), data });
    return res.json();
  }

  async getWOBoard(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/work-orders/board${qs}`, { headers: this.headers() });
    return res.json();
  }

  // ── PM Schedules ───────────────────────────────
  async listPMSchedules(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/pm-schedules${qs}`, { headers: this.headers() });
    return res.json();
  }

  async createPMSchedule(data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/pm-schedules`, { headers: this.headers(), data });
    return res.json();
  }

  // ── Config ─────────────────────────────────────
  async listFailureCodeSets(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/failure-code-sets${qs}`, { headers: this.headers() });
    return res.json();
  }

  async listStrategies(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/strategies${qs}`, { headers: this.headers() });
    return res.json();
  }

  async listJobPlans(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/job-plans${qs}`, { headers: this.headers() });
    return res.json();
  }

  async listChecklistTemplates(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/checklist-templates${qs}`, { headers: this.headers() });
    return res.json();
  }

  async getMaintenanceConfig() {
    const res = await this.request.get(`${API_BASE}/maintenance/config`, { headers: this.headers() });
    return res.json();
  }

  // ── Breakdown & Downtime ───────────────────────
  async logBreakdown(data: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}/maintenance/breakdowns`, { headers: this.headers(), data });
    return res.json();
  }

  async listBreakdowns(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/breakdowns${qs}`, { headers: this.headers() });
    return res.json();
  }

  async listDowntime(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}/maintenance/downtime${qs}`, { headers: this.headers() });
    return res.json();
  }

  // ── Dashboard & Reports ────────────────────────
  async getDashboard(role: 'manager' | 'planner' | 'technician' | 'plant-head' | 'finance' = 'manager') {
    const res = await this.request.get(`${API_BASE}/maintenance/dashboard/${role}`, { headers: this.headers() });
    return res.json();
  }

  // ── Generic helper ─────────────────────────────
  async get(path: string) {
    const res = await this.request.get(`${API_BASE}${path}`, { headers: this.headers() });
    return res.json();
  }

  async post(path: string, data?: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}${path}`, { headers: this.headers(), data });
    return res.json();
  }
}
