import { client } from './client';
import type { ApiResponse } from './auth';

// ── Onboarding Templates ──

async function listTemplates(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/onboarding/templates', { params });
    return response.data;
}

async function getTemplate(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/onboarding/templates/${id}`);
    return response.data;
}

async function createTemplate(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/onboarding/templates', data);
    return response.data;
}

async function updateTemplate(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/onboarding/templates/${id}`, data);
    return response.data;
}

async function deleteTemplate(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/onboarding/templates/${id}`);
    return response.data;
}

// ── Onboarding Tasks ──

async function generateTasks(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/onboarding/tasks/generate', data);
    return response.data;
}

async function listTasks(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/onboarding/tasks', { params });
    return response.data;
}

async function updateTask(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/onboarding/tasks/${id}`, data);
    return response.data;
}

// ── Onboarding Progress ──

async function getProgress(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/onboarding/progress/${employeeId}`);
    return response.data;
}

export const onboardingApi = {
    listTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generateTasks,
    listTasks,
    updateTask,
    getProgress,
};
