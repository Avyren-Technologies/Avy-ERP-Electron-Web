import { client } from './client';
import type { ApiResponse } from './auth';

// ── Leave Types ──

async function listLeaveTypes(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/leave-types', { params });
    return response.data;
}

async function getLeaveType(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/leave-types/${id}`);
    return response.data;
}

async function createLeaveType(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-types', data);
    return response.data;
}

async function updateLeaveType(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/leave-types/${id}`, data);
    return response.data;
}

async function deleteLeaveType(id: string, force = false): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/leave-types/${id}`, { params: force ? { force: 'true' } : undefined });
    return response.data;
}

// ── Leave Policies ──

async function listPolicies(params?: {
    page?: number;
    limit?: number;
    leaveTypeId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/leave-policies', { params });
    return response.data;
}

async function createPolicy(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-policies', data);
    return response.data;
}

async function updatePolicy(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/leave-policies/${id}`, data);
    return response.data;
}

async function deletePolicy(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/leave-policies/${id}`);
    return response.data;
}

// ── Leave Balances ──

async function listBalances(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    employeeIds?: string[];
    year?: number;
}): Promise<ApiResponse<any>> {
    // Serialize `employeeIds` as a CSV string so it round-trips through axios
    // params without `[]` bracket suffixes the backend doesn't expect.
    const { employeeIds, ...rest } = params ?? {};
    const finalParams: Record<string, unknown> = { ...rest };
    if (employeeIds && employeeIds.length > 0) finalParams.employeeIds = employeeIds.join(',');
    const response = await client.get('/hr/leave-balances', { params: finalParams });
    return response.data;
}

async function adjustBalance(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-balances/adjust', data);
    return response.data;
}

async function initializeBalances(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-balances/initialize', data);
    return response.data;
}

// ── Leave Requests ──

async function listRequests(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: string;
    from?: string;
    to?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/leave-requests', { params });
    return response.data;
}

async function getRequest(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/leave-requests/${id}`);
    return response.data;
}

async function createRequest(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-requests', data);
    return response.data;
}

async function approveRequest(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/leave-requests/${id}/approve`, data ?? {});
    return response.data;
}

async function rejectRequest(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/leave-requests/${id}/reject`, data ?? {});
    return response.data;
}

async function cancelRequest(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/leave-requests/${id}/cancel`, data ?? {});
    return response.data;
}

// ── Leave Balances — Direct Edit ──

async function updateBalance(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/leave-balances/${id}`, data);
    return response.data;
}

// ── Leave Balances — Transactions ──

async function listTransactions(balanceId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/leave-balances/${balanceId}/transactions`, { params });
    return response.data;
}

// ── Leave Balances — Encashment ──

async function encashBalance(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-balances/encash', data);
    return response.data;
}

// ── Leave Balances — Accrual & Carry Forward ──

async function accrueBalances(data: { month: number; year: number; dayOfMonth?: number }): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-balances/accrue', data);
    return response.data;
}

async function carryForwardBalances(data: { fromYear: number; toYear: number }): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-balances/carry-forward', data);
    return response.data;
}

// ── Leave Balances — Bulk Import ──

async function downloadBalanceTemplate(): Promise<any> {
    const response = await client.get('/hr/leave-balances/bulk/template', { responseType: 'blob' });
    return response.data;
}

async function validateBalanceUpload(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/hr/leave-balances/bulk/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

async function confirmBalanceImport(rows: any[]): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/leave-balances/bulk/import', { rows });
    return response.data;
}

// ── Leave Summary / Dashboard ──

async function getSummary(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/leave/summary');
    return response.data;
}

export const leaveApi = {
    // Leave Types
    listLeaveTypes,
    getLeaveType,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    // Leave Policies
    listPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    // Leave Balances
    listBalances,
    adjustBalance,
    initializeBalances,
    updateBalance,
    listTransactions,
    encashBalance,
    accrueBalances,
    carryForwardBalances,
    downloadBalanceTemplate,
    validateBalanceUpload,
    confirmBalanceImport,
    // Leave Requests
    listRequests,
    getRequest,
    createRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    // Summary
    getSummary,
};
