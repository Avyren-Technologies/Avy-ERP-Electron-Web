import { client } from './client';
import type { ApiResponse } from './auth';

// ── Attendance Records ──

async function listRecords(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    date?: string;
    from?: string;
    to?: string;
    status?: string;
    departmentId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/attendance', { params });
    return response.data;
}

async function getRecord(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/attendance/${id}`);
    return response.data;
}

async function createRecord(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/attendance', data);
    return response.data;
}

async function updateRecord(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/attendance/${id}`, data);
    return response.data;
}

// ── Attendance Summary / Dashboard ──

async function getSummary(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/attendance/summary');
    return response.data;
}

// ── Attendance Rules ──

async function getRules(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/attendance/rules');
    return response.data;
}

async function updateRules(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/attendance/rules', data);
    return response.data;
}

// ── Attendance Overrides ──

async function listOverrides(params?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/attendance/overrides', { params });
    return response.data;
}

async function createOverride(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/attendance/overrides', data);
    return response.data;
}

async function updateOverride(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/attendance/overrides/${id}`, data);
    return response.data;
}

// ── Holiday Calendar ──

async function listHolidays(params?: {
    page?: number;
    limit?: number;
    year?: number;
    type?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/holidays', { params });
    return response.data;
}

async function createHoliday(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/holidays', data);
    return response.data;
}

async function updateHoliday(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/holidays/${id}`, data);
    return response.data;
}

async function deleteHoliday(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/holidays/${id}`);
    return response.data;
}

async function cloneHolidays(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/holidays/clone', data);
    return response.data;
}

// ── Rosters ──

async function listRosters(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/rosters', { params });
    return response.data;
}

async function createRoster(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/rosters', data);
    return response.data;
}

async function updateRoster(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/rosters/${id}`, data);
    return response.data;
}

async function deleteRoster(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/rosters/${id}`);
    return response.data;
}

// ── Overtime Rules ──

async function getOvertimeRules(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/overtime-rules');
    return response.data;
}

async function updateOvertimeRules(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/overtime-rules', data);
    return response.data;
}

export const attendanceApi = {
    // Records
    listRecords,
    getRecord,
    createRecord,
    updateRecord,
    // Summary
    getSummary,
    // Rules
    getRules,
    updateRules,
    // Overrides
    listOverrides,
    createOverride,
    updateOverride,
    // Holidays
    listHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    cloneHolidays,
    // Rosters
    listRosters,
    createRoster,
    updateRoster,
    deleteRoster,
    // Overtime
    getOvertimeRules,
    updateOvertimeRules,
};
