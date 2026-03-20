import { client } from './client';
import type { ApiResponse } from './auth';

// ── Transfers ──

async function listTransfers(params?: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/transfers', { params });
    return response.data;
}

async function getTransfer(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/transfers/${id}`);
    return response.data;
}

async function createTransfer(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/transfers', data);
    return response.data;
}

async function approveTransfer(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/transfers/${id}/approve`, data ?? {});
    return response.data;
}

async function applyTransfer(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/transfers/${id}/apply`, data ?? {});
    return response.data;
}

async function rejectTransfer(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/transfers/${id}/reject`, data ?? {});
    return response.data;
}

async function cancelTransfer(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/transfers/${id}/cancel`, data ?? {});
    return response.data;
}

// ── Promotions ──

async function listPromotions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/promotions', { params });
    return response.data;
}

async function getPromotion(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/promotions/${id}`);
    return response.data;
}

async function createPromotion(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/promotions', data);
    return response.data;
}

async function approvePromotion(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/promotions/${id}/approve`, data ?? {});
    return response.data;
}

async function applyPromotion(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/promotions/${id}/apply`, data ?? {});
    return response.data;
}

async function rejectPromotion(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/promotions/${id}/reject`, data ?? {});
    return response.data;
}

async function cancelPromotion(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/promotions/${id}/cancel`, data ?? {});
    return response.data;
}

// ── Delegates ──

async function listDelegates(params?: {
    page?: number;
    limit?: number;
    managerId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/delegates', { params });
    return response.data;
}

async function createDelegate(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/delegates', data);
    return response.data;
}

async function revokeDelegate(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/delegates/${id}/revoke`);
    return response.data;
}

export const transferApi = {
    // Transfers
    listTransfers,
    getTransfer,
    createTransfer,
    approveTransfer,
    applyTransfer,
    rejectTransfer,
    cancelTransfer,
    // Promotions
    listPromotions,
    getPromotion,
    createPromotion,
    approvePromotion,
    applyPromotion,
    rejectPromotion,
    cancelPromotion,
    // Delegates
    listDelegates,
    createDelegate,
    revokeDelegate,
};
