import { client } from './client';
import type { ApiResponse } from './auth';

// ── API Functions ──

async function getSuperAdminStats(): Promise<ApiResponse<any>> {
    const response = await client.get('/platform/dashboard/stats');
    return response.data;
}

async function getRecentActivity(limit?: number): Promise<ApiResponse<any>> {
    const response = await client.get('/platform/dashboard/activity', { params: { limit } });
    return response.data;
}

async function getRevenueMetrics(): Promise<ApiResponse<any>> {
    const response = await client.get('/platform/dashboard/revenue');
    return response.data;
}

async function getBillingSummary(): Promise<ApiResponse<any>> {
    const response = await client.get('/platform/billing/summary');
    return response.data;
}

async function getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/platform/billing/invoices', { params });
    return response.data;
}

async function getRevenueChart(): Promise<ApiResponse<any>> {
    const response = await client.get('/platform/billing/revenue-chart');
    return response.data;
}

async function getCompanyAdminStats(): Promise<ApiResponse<any>> {
    const response = await client.get('/dashboard/company-stats');
    return response.data;
}

export const dashboardApi = {
    getSuperAdminStats,
    getRecentActivity,
    getRevenueMetrics,
    getBillingSummary,
    getInvoices,
    getRevenueChart,
    getCompanyAdminStats,
};
