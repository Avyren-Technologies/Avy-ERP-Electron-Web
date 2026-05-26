import { APIRequestContext } from '@playwright/test';

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3030/api/v1';

/**
 * Base API client with authentication and generic HTTP helpers.
 * Module-specific clients extend this class.
 *
 * Usage:
 *   class MaintenanceApiClient extends BaseApiClient { ... }
 *   class HRMSApiClient extends BaseApiClient { ... }
 */
export class BaseApiClient {
  private token: string = '';

  constructor(protected request: APIRequestContext) {}

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
      if (body.code === 'DUPLICATE_ENTRY' && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw new Error(`Login failed: ${body.message || body.error}`);
    }
    throw new Error('Login failed after retries');
  }

  protected headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  /** Generic GET */
  async get(path: string, params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await this.request.get(`${API_BASE}${path}${qs}`, { headers: this.headers() });
    return res.json();
  }

  /** Generic POST */
  async post(path: string, data?: Record<string, unknown>) {
    const res = await this.request.post(`${API_BASE}${path}`, { headers: this.headers(), data });
    return res.json();
  }

  /** Generic PATCH */
  async patch(path: string, data?: Record<string, unknown>) {
    const res = await this.request.patch(`${API_BASE}${path}`, { headers: this.headers(), data });
    return res.json();
  }

  /** Generic DELETE */
  async delete(path: string) {
    const res = await this.request.delete(`${API_BASE}${path}`, { headers: this.headers() });
    return res.json();
  }
}
