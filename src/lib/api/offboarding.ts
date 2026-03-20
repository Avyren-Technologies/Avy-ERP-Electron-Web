import { client } from './client';
import type { ApiResponse } from './auth';

// ── Exit Requests ──

async function listExitRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    separationType?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/exit-requests', { params });
    return response.data;
}

async function createExitRequest(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/exit-requests', data);
    return response.data;
}

async function getExitRequest(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/exit-requests/${id}`);
    return response.data;
}

async function updateExitRequest(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/exit-requests/${id}`, data);
    return response.data;
}

// ── Clearances ──

async function getExitClearances(exitRequestId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/exit-requests/${exitRequestId}/clearances`);
    return response.data;
}

async function updateClearance(clearanceId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/exit-clearances/${clearanceId}`, data);
    return response.data;
}

// ── Exit Interview ──

async function createExitInterview(exitRequestId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/exit-requests/${exitRequestId}/interview`, data);
    return response.data;
}

async function getExitInterview(exitRequestId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/exit-requests/${exitRequestId}/interview`);
    return response.data;
}

// ── F&F Settlements ──

async function computeFnF(exitRequestId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/exit-requests/${exitRequestId}/compute-fnf`);
    return response.data;
}

async function listFnFSettlements(params?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/fnf-settlements', { params });
    return response.data;
}

async function getFnFSettlement(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/fnf-settlements/${id}`);
    return response.data;
}

async function approveFnF(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/fnf-settlements/${id}/approve`);
    return response.data;
}

async function payFnF(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/fnf-settlements/${id}/pay`);
    return response.data;
}

export const offboardingApi = {
    // Exit Requests
    listExitRequests,
    createExitRequest,
    getExitRequest,
    updateExitRequest,
    // Clearances
    getExitClearances,
    updateClearance,
    // Exit Interview
    createExitInterview,
    getExitInterview,
    // F&F Settlements
    computeFnF,
    listFnFSettlements,
    getFnFSettlement,
    approveFnF,
    payFnF,
};
