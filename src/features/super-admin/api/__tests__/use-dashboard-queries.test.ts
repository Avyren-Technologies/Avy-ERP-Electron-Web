/**
 * Tests for src/features/super-admin/api/use-dashboard-queries.ts
 *
 * Each hook wraps useQuery from @tanstack/react-query and delegates HTTP work
 * to dashboardApi.  We verify:
 *   1. The correct dashboardApi function is called with the right arguments.
 *   2. Returned data is exposed through the hook.
 *   3. Error state is entered when the API rejects.
 *   4. Query key shapes match the dashboardKeys factory.
 *
 * Approach:
 *   - vi.hoisted() declares mock functions before vi.mock() hoisting.
 *   - Mock @/lib/api/dashboard entirely — no real HTTP calls.
 *   - Wrap renderHook in a fresh QueryClientProvider per test.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Hoisted mock definitions ──────────────────────────────────────────────────

const { mockDashboardApi } = vi.hoisted(() => ({
    mockDashboardApi: {
        getSuperAdminStats: vi.fn(),
        getRecentActivity: vi.fn(),
        getRevenueMetrics: vi.fn(),
        getBillingSummary: vi.fn(),
        getInvoices: vi.fn(),
        getRevenueChart: vi.fn(),
        getCompanyAdminStats: vi.fn(),
    },
}));

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/api/dashboard', () => ({
    dashboardApi: mockDashboardApi,
}));

// ── Import hooks after mocks ──────────────────────────────────────────────────

import {
    useSuperAdminStats,
    useRecentActivity,
    useRevenueMetrics,
    useBillingSummary,
    useInvoices,
    useRevenueChart,
    useCompanyAdminStats,
    dashboardKeys,
} from '@/features/super-admin/api/use-dashboard-queries';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ── dashboardKeys ─────────────────────────────────────────────────────────────

describe('dashboardKeys', () => {
    it('all is ["dashboard"]', () => {
        expect(dashboardKeys.all).toEqual(['dashboard']);
    });

    it('stats() is ["dashboard", "stats"]', () => {
        expect(dashboardKeys.stats()).toEqual(['dashboard', 'stats']);
    });

    it('activity() is ["dashboard", "activity"]', () => {
        expect(dashboardKeys.activity()).toEqual(['dashboard', 'activity']);
    });

    it('revenue() is ["dashboard", "revenue"]', () => {
        expect(dashboardKeys.revenue()).toEqual(['dashboard', 'revenue']);
    });

    it('billing() is ["billing"]', () => {
        expect(dashboardKeys.billing()).toEqual(['billing']);
    });

    it('billingSummary() is ["billing", "summary"]', () => {
        expect(dashboardKeys.billingSummary()).toEqual(['billing', 'summary']);
    });

    it('invoices(params) is ["billing", "invoices", params]', () => {
        const params = { page: 1, status: 'paid' };
        expect(dashboardKeys.invoices(params)).toEqual(['billing', 'invoices', params]);
    });

    it('revenueChart() is ["billing", "chart"]', () => {
        expect(dashboardKeys.revenueChart()).toEqual(['billing', 'chart']);
    });

    it('companyAdmin() is ["dashboard", "company-admin"]', () => {
        expect(dashboardKeys.companyAdmin()).toEqual(['dashboard', 'company-admin']);
    });
});

// ── useSuperAdminStats ────────────────────────────────────────────────────────

describe('useSuperAdminStats', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls dashboardApi.getSuperAdminStats on mount', async () => {
        mockDashboardApi.getSuperAdminStats.mockResolvedValueOnce({
            success: true,
            data: { totalCompanies: 10 },
        });
        renderHook(() => useSuperAdminStats(), { wrapper: makeWrapper() });

        await waitFor(() =>
            expect(mockDashboardApi.getSuperAdminStats).toHaveBeenCalledTimes(1),
        );
    });

    it('exposes data returned by getSuperAdminStats', async () => {
        const payload = { success: true, data: { totalCompanies: 10, activeUsers: 50 } };
        mockDashboardApi.getSuperAdminStats.mockResolvedValueOnce(payload);
        const { result } = renderHook(() => useSuperAdminStats(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(payload);
    });

    it('enters error state when getSuperAdminStats rejects', async () => {
        mockDashboardApi.getSuperAdminStats.mockRejectedValueOnce(new Error('Forbidden'));
        const { result } = renderHook(() => useSuperAdminStats(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ── useRecentActivity ─────────────────────────────────────────────────────────

describe('useRecentActivity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls getRecentActivity with the default limit of 10 when no argument is given', async () => {
        mockDashboardApi.getRecentActivity.mockResolvedValueOnce({ success: true, data: [] });
        renderHook(() => useRecentActivity(), { wrapper: makeWrapper() });

        await waitFor(() => expect(mockDashboardApi.getRecentActivity).toHaveBeenCalled());
        expect(mockDashboardApi.getRecentActivity).toHaveBeenCalledWith(10);
    });

    it('forwards a custom limit to getRecentActivity', async () => {
        mockDashboardApi.getRecentActivity.mockResolvedValueOnce({ success: true, data: [] });
        renderHook(() => useRecentActivity(25), { wrapper: makeWrapper() });

        await waitFor(() => expect(mockDashboardApi.getRecentActivity).toHaveBeenCalled());
        expect(mockDashboardApi.getRecentActivity).toHaveBeenCalledWith(25);
    });

    it('exposes data returned by getRecentActivity', async () => {
        const payload = { success: true, data: [{ id: 'act-1', type: 'LOGIN' }] };
        mockDashboardApi.getRecentActivity.mockResolvedValueOnce(payload);
        const { result } = renderHook(() => useRecentActivity(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(payload);
    });

    it('enters error state when getRecentActivity rejects', async () => {
        mockDashboardApi.getRecentActivity.mockRejectedValueOnce(new Error('Timeout'));
        const { result } = renderHook(() => useRecentActivity(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ── useRevenueMetrics ─────────────────────────────────────────────────────────

describe('useRevenueMetrics', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls dashboardApi.getRevenueMetrics on mount', async () => {
        mockDashboardApi.getRevenueMetrics.mockResolvedValueOnce({
            success: true,
            data: { mrr: 50000 },
        });
        renderHook(() => useRevenueMetrics(), { wrapper: makeWrapper() });

        await waitFor(() =>
            expect(mockDashboardApi.getRevenueMetrics).toHaveBeenCalledTimes(1),
        );
        // Called with no arguments
        expect(mockDashboardApi.getRevenueMetrics).toHaveBeenCalledWith();
    });

    it('exposes data returned by getRevenueMetrics', async () => {
        const payload = { success: true, data: { mrr: 50000, arr: 600000 } };
        mockDashboardApi.getRevenueMetrics.mockResolvedValueOnce(payload);
        const { result } = renderHook(() => useRevenueMetrics(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(payload);
    });

    it('enters error state when getRevenueMetrics rejects', async () => {
        mockDashboardApi.getRevenueMetrics.mockRejectedValueOnce(new Error('Server Error'));
        const { result } = renderHook(() => useRevenueMetrics(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ── useBillingSummary ─────────────────────────────────────────────────────────

describe('useBillingSummary', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls dashboardApi.getBillingSummary on mount', async () => {
        mockDashboardApi.getBillingSummary.mockResolvedValueOnce({
            success: true,
            data: { outstanding: 5000 },
        });
        renderHook(() => useBillingSummary(), { wrapper: makeWrapper() });

        await waitFor(() =>
            expect(mockDashboardApi.getBillingSummary).toHaveBeenCalledTimes(1),
        );
        expect(mockDashboardApi.getBillingSummary).toHaveBeenCalledWith();
    });

    it('exposes data returned by getBillingSummary', async () => {
        const payload = { success: true, data: { outstanding: 12000, paid: 48000 } };
        mockDashboardApi.getBillingSummary.mockResolvedValueOnce(payload);
        const { result } = renderHook(() => useBillingSummary(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(payload);
    });

    it('enters error state when getBillingSummary rejects', async () => {
        mockDashboardApi.getBillingSummary.mockRejectedValueOnce(new Error('Not Found'));
        const { result } = renderHook(() => useBillingSummary(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ── useInvoices ───────────────────────────────────────────────────────────────

describe('useInvoices', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls dashboardApi.getInvoices with no params when none are provided', async () => {
        mockDashboardApi.getInvoices.mockResolvedValueOnce({ success: true, data: [] });
        renderHook(() => useInvoices(), { wrapper: makeWrapper() });

        await waitFor(() => expect(mockDashboardApi.getInvoices).toHaveBeenCalled());
        expect(mockDashboardApi.getInvoices).toHaveBeenCalledWith(undefined);
    });

    it('forwards pagination and status params to getInvoices', async () => {
        mockDashboardApi.getInvoices.mockResolvedValueOnce({ success: true, data: [] });
        const params = { page: 2, limit: 15, status: 'overdue' };
        renderHook(() => useInvoices(params), { wrapper: makeWrapper() });

        await waitFor(() => expect(mockDashboardApi.getInvoices).toHaveBeenCalled());
        expect(mockDashboardApi.getInvoices).toHaveBeenCalledWith(params);
    });

    it('exposes data returned by getInvoices', async () => {
        const payload = { success: true, data: [{ id: 'inv-1', amount: 5000, status: 'paid' }] };
        mockDashboardApi.getInvoices.mockResolvedValueOnce(payload);
        const { result } = renderHook(() => useInvoices(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(payload);
    });

    it('enters error state when getInvoices rejects', async () => {
        mockDashboardApi.getInvoices.mockRejectedValueOnce(new Error('Server Error'));
        const { result } = renderHook(() => useInvoices(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ── useRevenueChart ───────────────────────────────────────────────────────────

describe('useRevenueChart', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls dashboardApi.getRevenueChart on mount', async () => {
        mockDashboardApi.getRevenueChart.mockResolvedValueOnce({
            success: true,
            data: { labels: [], values: [] },
        });
        renderHook(() => useRevenueChart(), { wrapper: makeWrapper() });

        await waitFor(() =>
            expect(mockDashboardApi.getRevenueChart).toHaveBeenCalledTimes(1),
        );
        expect(mockDashboardApi.getRevenueChart).toHaveBeenCalledWith();
    });

    it('exposes data returned by getRevenueChart', async () => {
        const payload = {
            success: true,
            data: { labels: ['Jan', 'Feb', 'Mar'], values: [10000, 15000, 12000] },
        };
        mockDashboardApi.getRevenueChart.mockResolvedValueOnce(payload);
        const { result } = renderHook(() => useRevenueChart(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(payload);
    });

    it('enters error state when getRevenueChart rejects', async () => {
        mockDashboardApi.getRevenueChart.mockRejectedValueOnce(new Error('Timeout'));
        const { result } = renderHook(() => useRevenueChart(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ── useCompanyAdminStats ──────────────────────────────────────────────────────

describe('useCompanyAdminStats', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls dashboardApi.getCompanyAdminStats on mount', async () => {
        mockDashboardApi.getCompanyAdminStats.mockResolvedValueOnce({
            success: true,
            data: { employees: 100 },
        });
        renderHook(() => useCompanyAdminStats(), { wrapper: makeWrapper() });

        await waitFor(() =>
            expect(mockDashboardApi.getCompanyAdminStats).toHaveBeenCalledTimes(1),
        );
        expect(mockDashboardApi.getCompanyAdminStats).toHaveBeenCalledWith();
    });

    it('exposes data returned by getCompanyAdminStats', async () => {
        const payload = { success: true, data: { employees: 220, openTickets: 5 } };
        mockDashboardApi.getCompanyAdminStats.mockResolvedValueOnce(payload);
        const { result } = renderHook(() => useCompanyAdminStats(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(payload);
    });

    it('enters error state when getCompanyAdminStats rejects', async () => {
        mockDashboardApi.getCompanyAdminStats.mockRejectedValueOnce(new Error('Unauthorized'));
        const { result } = renderHook(() => useCompanyAdminStats(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
