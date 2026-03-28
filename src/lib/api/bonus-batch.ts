import { client } from './client';
import type { ApiResponse } from './auth';

// ── Bonus Batches ──

async function listBatches(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/bonus-batches', { params });
    return response.data;
}

async function createBatch(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/bonus-batches', data);
    return response.data;
}

async function getBatch(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/bonus-batches/${id}`);
    return response.data;
}

async function approveBatch(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/bonus-batches/${id}/approve`);
    return response.data;
}

async function mergeBatch(id: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/bonus-batches/${id}/merge`);
    return response.data;
}

export const bonusBatchApi = {
    listBatches,
    createBatch,
    getBatch,
    approveBatch,
    mergeBatch,
};
