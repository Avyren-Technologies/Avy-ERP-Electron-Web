/**
 * Tests for src/lib/api/dashboard.ts
 *
 * dashboardApi wraps axios `client` GET calls and unwraps the Axios envelope
 * manually (`response.data`), returning the raw API payload to callers.
 *
 * Strategy: mock `@/lib/api/client` entirely so no real HTTP calls are made
 * and none of the request/response interceptors run.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardApi } from '@/lib/api/dashboard';

// ── Mock the axios client ──────────────────────────────────────────────────────

vi.mock('@/lib/api/client', () => ({
    client: {
        get: vi.fn(),
    },
}));

import { client } from '@/lib/api/client';

const mockedGet = vi.mocked(client.get);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wrap a value in the Axios-shaped { data: ... } envelope. */
function axiosResp<T>(payload: T) {
    return { data: payload };
}

// ── dashboardApi.getSuperAdminStats ───────────────────────────────────────────

describe('dashboardApi.getSuperAdminStats', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /platform/dashboard/stats', async () => {
        const payload = { success: true, data: { totalCompanies: 42, activeUsers: 128 } };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));

        const result = await dashboardApi.getSuperAdminStats();

        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/platform/dashboard/stats');
        expect(result).toEqual(payload);
    });

    it('returns the raw API response including success flag', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: false, error: 'UNAUTHORIZED' }));
        const result = await dashboardApi.getSuperAdminStats();
        expect(result).toEqual({ success: false, error: 'UNAUTHORIZED' });
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Network error'));
        await expect(dashboardApi.getSuperAdminStats()).rejects.toThrow('Network error');
    });
});

// ── dashboardApi.getRecentActivity ────────────────────────────────────────────

describe('dashboardApi.getRecentActivity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /platform/dashboard/activity with no limit param when omitted', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));

        await dashboardApi.getRecentActivity();

        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/platform/dashboard/activity', {
            params: { limit: undefined },
        });
    });

    it('forwards the limit param when provided', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));

        await dashboardApi.getRecentActivity(25);

        expect(mockedGet).toHaveBeenCalledWith('/platform/dashboard/activity', {
            params: { limit: 25 },
        });
    });

    it('returns the unwrapped API payload', async () => {
        const payload = { success: true, data: [{ id: 'act-1', type: 'LOGIN' }] };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));
        const result = await dashboardApi.getRecentActivity(10);
        expect(result).toEqual(payload);
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Timeout'));
        await expect(dashboardApi.getRecentActivity()).rejects.toThrow('Timeout');
    });
});

// ── dashboardApi.getRevenueMetrics ────────────────────────────────────────────

describe('dashboardApi.getRevenueMetrics', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /platform/dashboard/revenue', async () => {
        const payload = { success: true, data: { mrr: 50000, arr: 600000 } };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));

        const result = await dashboardApi.getRevenueMetrics();

        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/platform/dashboard/revenue');
        expect(result).toEqual(payload);
    });

    it('does not send any params', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true }));
        await dashboardApi.getRevenueMetrics();
        // Called with only the URL — no second argument
        expect(mockedGet).toHaveBeenCalledWith('/platform/dashboard/revenue');
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Server Error'));
        await expect(dashboardApi.getRevenueMetrics()).rejects.toThrow('Server Error');
    });
});

// ── dashboardApi.getBillingSummary ────────────────────────────────────────────

describe('dashboardApi.getBillingSummary', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /platform/billing/summary', async () => {
        const payload = { success: true, data: { outstanding: 12000 } };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));

        const result = await dashboardApi.getBillingSummary();

        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/platform/billing/summary');
        expect(result).toEqual(payload);
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Forbidden'));
        await expect(dashboardApi.getBillingSummary()).rejects.toThrow('Forbidden');
    });
});

// ── dashboardApi.getInvoices ──────────────────────────────────────────────────

describe('dashboardApi.getInvoices', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /platform/billing/invoices with no params when omitted', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));

        await dashboardApi.getInvoices();

        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/platform/billing/invoices', {
            params: undefined,
        });
    });

    it('forwards pagination params', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));
        const params = { page: 3, limit: 15 };
        await dashboardApi.getInvoices(params);
        expect(mockedGet).toHaveBeenCalledWith('/platform/billing/invoices', { params });
    });

    it('forwards status filter', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));
        const params = { status: 'overdue' };
        await dashboardApi.getInvoices(params);
        expect(mockedGet).toHaveBeenCalledWith('/platform/billing/invoices', { params });
    });

    it('forwards all params together', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));
        const params = { page: 1, limit: 10, status: 'paid' };
        await dashboardApi.getInvoices(params);
        expect(mockedGet).toHaveBeenCalledWith('/platform/billing/invoices', { params });
    });

    it('returns the unwrapped API payload', async () => {
        const payload = { success: true, data: [{ id: 'inv-1', amount: 5000 }] };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));
        const result = await dashboardApi.getInvoices({ page: 1 });
        expect(result).toEqual(payload);
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Not Found'));
        await expect(dashboardApi.getInvoices()).rejects.toThrow('Not Found');
    });
});

// ── dashboardApi.getRevenueChart ──────────────────────────────────────────────

describe('dashboardApi.getRevenueChart', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /platform/billing/revenue-chart', async () => {
        const payload = { success: true, data: { labels: ['Jan', 'Feb'], values: [10000, 15000] } };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));

        const result = await dashboardApi.getRevenueChart();

        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/platform/billing/revenue-chart');
        expect(result).toEqual(payload);
    });

    it('does not send any params', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true }));
        await dashboardApi.getRevenueChart();
        expect(mockedGet).toHaveBeenCalledWith('/platform/billing/revenue-chart');
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Timeout'));
        await expect(dashboardApi.getRevenueChart()).rejects.toThrow('Timeout');
    });
});

// ── dashboardApi.getCompanyAdminStats ─────────────────────────────────────────

describe('dashboardApi.getCompanyAdminStats', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /dashboard/company-stats (company-admin endpoint, no /platform prefix)', async () => {
        const payload = { success: true, data: { employees: 220, openTickets: 5 } };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));

        const result = await dashboardApi.getCompanyAdminStats();

        expect(mockedGet).toHaveBeenCalledTimes(1);
        // NOTE: this endpoint intentionally does NOT have the /platform prefix —
        // it is a company-scoped endpoint served at a different route.
        expect(mockedGet).toHaveBeenCalledWith('/dashboard/company-stats');
        expect(result).toEqual(payload);
    });

    it('does not call /platform/dashboard/stats (which is the super-admin endpoint)', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true }));
        await dashboardApi.getCompanyAdminStats();
        const calledWith = mockedGet.mock.calls[0][0];
        expect(calledWith).not.toBe('/platform/dashboard/stats');
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Unauthorized'));
        await expect(dashboardApi.getCompanyAdminStats()).rejects.toThrow('Unauthorized');
    });
});
