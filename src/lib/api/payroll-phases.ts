import { client } from './client';
import type { ApiResponse } from './auth';

// ── Phase A: Configuration Prerequisites ──

async function getConfigurationStatus(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/configuration-status');
    return response.data;
}

// ── Phase B: Pre-Run Checklist ──

async function getPreRunChecklist(runId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/payroll-runs/${runId}/pre-run-checklist`);
    return response.data;
}

// ── Phase D: Post-Run ──

async function getPostRunChecklist(runId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/payroll-runs/${runId}/post-run-checklist`);
    return response.data;
}

async function completePostRunActivity(runId: string, activityId: string, data?: { note?: string }): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll-runs/${runId}/post-run-checklist/${activityId}/complete`, data ?? {});
    return response.data;
}

async function getPostRunInsights(runId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/payroll-runs/${runId}/post-run-insights`);
    return response.data;
}

export const payrollPhasesApi = {
    getConfigurationStatus,
    getPreRunChecklist,
    getPostRunChecklist,
    completePostRunActivity,
    getPostRunInsights,
};
