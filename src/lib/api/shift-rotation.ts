import { client } from './client';
import type { ApiResponse } from './auth';

// ── Shift Rotations ──

async function listRotations(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/shift-rotations', { params });
    return response.data;
}

async function getRotation(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/shift-rotations/${id}`);
    return response.data;
}

async function createRotation(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/shift-rotations', data);
    return response.data;
}

async function updateRotation(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/shift-rotations/${id}`, data);
    return response.data;
}

async function deleteRotation(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/shift-rotations/${id}`);
    return response.data;
}

// ── Assignments ──

async function assignRotation(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/shift-rotations/${id}/assign`, data);
    return response.data;
}

async function unassignRotation(id: string, employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/shift-rotations/${id}/assign/${employeeId}`);
    return response.data;
}

// ── Execute ──

async function executeRotations(): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/shift-rotations/execute');
    return response.data;
}

export const shiftRotationApi = {
    listRotations,
    getRotation,
    createRotation,
    updateRotation,
    deleteRotation,
    assignRotation,
    unassignRotation,
    executeRotations,
};
