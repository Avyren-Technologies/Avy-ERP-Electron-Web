import { client } from './client';
import type { ApiResponse } from './auth';

// ── Incentive Configs ──

async function listConfigs(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/production-incentives/configs', { params });
    return response.data;
}

async function getConfig(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/production-incentives/configs/${id}`);
    return response.data;
}

async function createConfig(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/production-incentives/configs', data);
    return response.data;
}

async function updateConfig(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/production-incentives/configs/${id}`, data);
    return response.data;
}

async function deleteConfig(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/production-incentives/configs/${id}`);
    return response.data;
}

async function computeIncentive(configId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/production-incentives/configs/${configId}/compute`);
    return response.data;
}

async function mergeIncentive(configId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/production-incentives/configs/${configId}/merge`);
    return response.data;
}

// ── Incentive Records ──

async function listRecords(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/production-incentives/records', { params });
    return response.data;
}

export const productionIncentiveApi = {
    listConfigs,
    getConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    computeIncentive,
    mergeIncentive,
    listRecords,
};
