import { client } from './client';
import type { ApiResponse } from './auth';

// ── Profile ──

async function getProfile(): Promise<ApiResponse<any>> {
    const response = await client.get('/company/profile');
    return response.data;
}

async function updateProfileSection(
    sectionKey: string,
    data: any,
): Promise<ApiResponse<any>> {
    const response = await client.patch(
        `/company/profile/sections/${sectionKey}`,
        data,
    );
    return response.data;
}

// ── Locations ──

async function listLocations(): Promise<ApiResponse<any>> {
    const response = await client.get('/company/locations');
    return response.data;
}

async function getLocation(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/company/locations/${id}`);
    return response.data;
}

async function updateLocation(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/company/locations/${id}`, data);
    return response.data;
}

async function deleteLocation(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/company/locations/${id}`);
    return response.data;
}

// ── Shifts ──

async function listShifts(): Promise<ApiResponse<any>> {
    const response = await client.get('/company/shifts');
    return response.data;
}

async function createShift(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/company/shifts', data);
    return response.data;
}

async function updateShift(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/company/shifts/${id}`, data);
    return response.data;
}

async function deleteShift(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/company/shifts/${id}`);
    return response.data;
}

// ── Contacts ──

async function listContacts(): Promise<ApiResponse<any>> {
    const response = await client.get('/company/contacts');
    return response.data;
}

async function createContact(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/company/contacts', data);
    return response.data;
}

async function updateContact(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/company/contacts/${id}`, data);
    return response.data;
}

async function deleteContact(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/company/contacts/${id}`);
    return response.data;
}

// ── No Series ──

async function listNoSeries(): Promise<ApiResponse<any>> {
    const response = await client.get('/company/no-series');
    return response.data;
}

async function createNoSeries(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/company/no-series', data);
    return response.data;
}

async function updateNoSeries(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/company/no-series/${id}`, data);
    return response.data;
}

async function deleteNoSeries(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/company/no-series/${id}`);
    return response.data;
}

// ── IOT Reasons ──

async function listIOTReasons(): Promise<ApiResponse<any>> {
    const response = await client.get('/company/iot-reasons');
    return response.data;
}

async function createIOTReason(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/company/iot-reasons', data);
    return response.data;
}

async function updateIOTReason(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/company/iot-reasons/${id}`, data);
    return response.data;
}

async function deleteIOTReason(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/company/iot-reasons/${id}`);
    return response.data;
}

// ── Controls ──

async function getControls(): Promise<ApiResponse<any>> {
    const response = await client.get('/company/controls');
    return response.data;
}

async function updateControls(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/company/controls', data);
    return response.data;
}

// ── Settings ──

async function getSettings(): Promise<ApiResponse<any>> {
    const response = await client.get('/company/settings');
    return response.data;
}

async function updateSettings(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/company/settings', data);
    return response.data;
}

// ── Users ──

async function listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/company/users', { params });
    return response.data;
}

async function createUser(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/company/users', data);
    return response.data;
}

async function getUser(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/company/users/${id}`);
    return response.data;
}

async function updateUser(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/company/users/${id}`, data);
    return response.data;
}

async function updateUserStatus(id: string, status: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/company/users/${id}/status`, { status });
    return response.data;
}

// ── Audit Logs ──

async function listAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/company/audit-logs', { params });
    return response.data;
}

// ── Activity ──

async function getCompanyActivity(limit?: number): Promise<ApiResponse<any>> {
    const response = await client.get('/dashboard/company-activity', { params: { limit } });
    return response.data;
}

export const companyAdminApi = {
    getProfile,
    updateProfileSection,
    listLocations,
    getLocation,
    updateLocation,
    deleteLocation,
    listShifts,
    createShift,
    updateShift,
    deleteShift,
    listContacts,
    createContact,
    updateContact,
    deleteContact,
    listNoSeries,
    createNoSeries,
    updateNoSeries,
    deleteNoSeries,
    listIOTReasons,
    createIOTReason,
    updateIOTReason,
    deleteIOTReason,
    getControls,
    updateControls,
    getSettings,
    updateSettings,
    listUsers,
    createUser,
    getUser,
    updateUser,
    updateUserStatus,
    listAuditLogs,
    getCompanyActivity,
};
