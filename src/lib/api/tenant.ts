import { client } from './client';
import type { ApiResponse } from './auth';

// ── API Functions ──

async function onboard(payload: any): Promise<ApiResponse<any>> {
    const response = await client.post('/platform/tenants/onboard', payload);
    return response.data;
}

async function listCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/platform/companies', { params });
    return response.data;
}

async function getCompanyDetail(companyId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/platform/companies/${companyId}`);
    return response.data;
}

async function updateSection(
    companyId: string,
    sectionKey: string,
    data: any,
): Promise<ApiResponse<any>> {
    const response = await client.patch(
        `/platform/companies/${companyId}/sections/${sectionKey}`,
        data,
    );
    return response.data;
}

async function updateStatus(companyId: string, status: string): Promise<ApiResponse<any>> {
    const response = await client.put(`/platform/companies/${companyId}/status`, { status });
    return response.data;
}

async function deleteCompany(companyId: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/platform/companies/${companyId}`);
    return response.data;
}

async function downloadBulkTemplate(): Promise<Blob> {
    const response = await client.get('/platform/tenants/bulk/template', { responseType: 'blob' });
    return response.data;
}

async function bulkValidate(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/platform/tenants/bulk/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

async function bulkImport(companies: { name: string; payload: any }[]): Promise<ApiResponse<any>> {
    const response = await client.post('/platform/tenants/bulk/import', { companies });
    return response.data;
}

export const tenantApi = {
    onboard,
    listCompanies,
    getCompanyDetail,
    updateSection,
    updateStatus,
    deleteCompany,
    downloadBulkTemplate,
    bulkValidate,
    bulkImport,
};
