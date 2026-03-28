import { client } from './client';
import type { ApiResponse } from './auth';

// ── Biometric Devices ──

async function listDevices(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/biometric-devices', { params });
    return response.data;
}

async function getDevice(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/biometric-devices/${id}`);
    return response.data;
}

async function createDevice(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/biometric-devices', data);
    return response.data;
}

async function updateDevice(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/biometric-devices/${id}`, data);
    return response.data;
}

async function deleteDevice(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/biometric-devices/${id}`);
    return response.data;
}

async function testDevice(id: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/biometric-devices/${id}/test`);
    return response.data;
}

async function syncDevice(id: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/biometric-devices/${id}/sync`);
    return response.data;
}

export const biometricApi = {
    listDevices,
    getDevice,
    createDevice,
    updateDevice,
    deleteDevice,
    testDevice,
    syncDevice,
};
