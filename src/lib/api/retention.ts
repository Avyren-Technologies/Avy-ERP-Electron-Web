import { client } from './client';
import type { ApiResponse } from './auth';

// ── Retention Policies ──

async function listPolicies(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/retention/policies', { params });
    return response.data;
}

async function createPolicy(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/retention/policies', data);
    return response.data;
}

async function deletePolicy(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/retention/policies/${id}`);
    return response.data;
}

// ── Data Requests ──

async function listDataRequests(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/retention/data-requests', { params });
    return response.data;
}

async function createDataRequest(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/retention/data-requests', data);
    return response.data;
}

async function updateDataRequest(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/retention/data-requests/${id}`, data);
    return response.data;
}

// ── Data Export ──

async function getDataExport(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/retention/data-export/${employeeId}`);
    return response.data;
}

// ── Anonymise ──

async function anonymiseEmployee(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/retention/anonymise/${employeeId}`);
    return response.data;
}

// ── Consents ──

async function listConsents(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/retention/consents/${employeeId}`);
    return response.data;
}

async function createConsent(employeeId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/retention/consents/${employeeId}`, data);
    return response.data;
}

// ── Check Due ──

async function checkDue(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/retention/check-due');
    return response.data;
}

export const retentionApi = {
    listPolicies,
    createPolicy,
    deletePolicy,
    listDataRequests,
    createDataRequest,
    updateDataRequest,
    getDataExport,
    anonymiseEmployee,
    listConsents,
    createConsent,
    checkDue,
};
