import { client } from './client';
import type { ApiResponse } from './auth';

// ── Visit Management ──

async function listVisits(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    visitorTypeId?: string;
    hostEmployeeId?: string;
    plantId?: string;
    gateId?: string;
    dateFrom?: string;
    dateTo?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/visits', { params });
    return response.data;
}

async function getVisit(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/visitors/visits/${id}`);
    return response.data;
}

async function getVisitByCode(code: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/visitors/visits/code/${code}`);
    return response.data;
}

async function createVisit(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/visits', data);
    return response.data;
}

async function updateVisit(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.put(`/visitors/visits/${id}`, data);
    return response.data;
}

async function deleteVisit(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/visitors/visits/${id}`);
    return response.data;
}

async function checkInVisit(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/visits/${id}/check-in`, data ?? {});
    return response.data;
}

async function checkOutVisit(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/visits/${id}/check-out`, data ?? {});
    return response.data;
}

async function approveVisit(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/visits/${id}/approve`, data ?? {});
    return response.data;
}

async function rejectVisit(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/visits/${id}/reject`, data ?? {});
    return response.data;
}

async function extendVisit(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/visits/${id}/extend`, data);
    return response.data;
}

async function completeInduction(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/visits/${id}/complete-induction`, data ?? {});
    return response.data;
}

// ── Visitor Types ──

async function listVisitorTypes(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/types', { params });
    return response.data;
}

async function getVisitorType(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/visitors/types/${id}`);
    return response.data;
}

async function createVisitorType(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/types', data);
    return response.data;
}

async function updateVisitorType(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.put(`/visitors/types/${id}`, data);
    return response.data;
}

async function deleteVisitorType(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/visitors/types/${id}`);
    return response.data;
}

// ── Gates ──

async function listGates(params?: {
    page?: number;
    limit?: number;
    search?: string;
    plantId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/gates', { params });
    return response.data;
}

async function getGate(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/visitors/gates/${id}`);
    return response.data;
}

async function createGate(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/gates', data);
    return response.data;
}

async function updateGate(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.put(`/visitors/gates/${id}`, data);
    return response.data;
}

async function deleteGate(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/visitors/gates/${id}`);
    return response.data;
}

// ── Safety Inductions ──

async function listSafetyInductions(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/safety-inductions', { params });
    return response.data;
}

async function createSafetyInduction(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/safety-inductions', data);
    return response.data;
}

async function updateSafetyInduction(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.put(`/visitors/safety-inductions/${id}`, data);
    return response.data;
}

async function deleteSafetyInduction(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/visitors/safety-inductions/${id}`);
    return response.data;
}

// ── VMS Configuration ──

async function getVmsConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/config');
    return response.data;
}

async function updateVmsConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.put('/visitors/config', data);
    return response.data;
}

// ── Watchlist & Blocklist ──

async function listWatchlist(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/watchlist', { params });
    return response.data;
}

async function createWatchlistEntry(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/watchlist', data);
    return response.data;
}

async function updateWatchlistEntry(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.put(`/visitors/watchlist/${id}`, data);
    return response.data;
}

async function deleteWatchlistEntry(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/visitors/watchlist/${id}`);
    return response.data;
}

async function checkWatchlist(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/watchlist/check', data);
    return response.data;
}

// ── Denied Entries ──

async function listDeniedEntries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/denied-entries', { params });
    return response.data;
}

async function getDeniedEntry(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/visitors/denied-entries/${id}`);
    return response.data;
}

// ── Recurring Passes ──

async function listRecurringPasses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/recurring-passes', { params });
    return response.data;
}

async function createRecurringPass(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/recurring-passes', data);
    return response.data;
}

async function updateRecurringPass(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.put(`/visitors/recurring-passes/${id}`, data);
    return response.data;
}

async function revokeRecurringPass(id: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/recurring-passes/${id}/revoke`);
    return response.data;
}

async function checkInRecurringPass(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/recurring-passes/${id}/check-in`, data ?? {});
    return response.data;
}

// ── Group Visits ──

async function listGroupVisits(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/group-visits', { params });
    return response.data;
}

async function createGroupVisit(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/group-visits', data);
    return response.data;
}

async function updateGroupVisit(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.put(`/visitors/group-visits/${id}`, data);
    return response.data;
}

async function batchCheckInGroupVisit(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/group-visits/${id}/batch-check-in`, data ?? {});
    return response.data;
}

async function batchCheckOutGroupVisit(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/group-visits/${id}/batch-check-out`, data ?? {});
    return response.data;
}

// ── Vehicle Passes ──

async function listVehiclePasses(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/vehicle-passes', { params });
    return response.data;
}

async function createVehiclePass(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/vehicle-passes', data);
    return response.data;
}

async function recordVehicleExit(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/vehicle-passes/${id}/exit`, data ?? {});
    return response.data;
}

// ── Material Passes ──

async function listMaterialPasses(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/material-passes', { params });
    return response.data;
}

async function createMaterialPass(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/material-passes', data);
    return response.data;
}

async function returnMaterialPass(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/visitors/material-passes/${id}/return`, data ?? {});
    return response.data;
}

// ── Dashboard ──

async function getDashboardToday(params?: {
    plantId?: string;
    gateId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/dashboard/today', { params });
    return response.data;
}

async function getDashboardOnSite(params?: {
    plantId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/dashboard/on-site', { params });
    return response.data;
}

async function getDashboardStats(params?: {
    dateFrom?: string;
    dateTo?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/dashboard/stats', { params });
    return response.data;
}

// ── Reports ──

async function getDailyLog(params?: {
    date?: string;
    plantId?: string;
    gateId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/reports/daily-log', { params });
    return response.data;
}

async function getReportSummary(params?: {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/reports/summary', { params });
    return response.data;
}

async function getOverstayReport(params?: {
    dateFrom?: string;
    dateTo?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/reports/overstay', { params });
    return response.data;
}

async function getAnalytics(params?: {
    dateFrom?: string;
    dateTo?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/reports/analytics', { params });
    return response.data;
}

// ── Emergency Muster ──

async function triggerEmergency(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/emergency/trigger', data);
    return response.data;
}

async function getMusterList(): Promise<ApiResponse<any>> {
    const response = await client.get('/visitors/emergency/muster-list');
    return response.data;
}

async function markSafe(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/emergency/mark-safe', data);
    return response.data;
}

async function resolveEmergency(data?: any): Promise<ApiResponse<any>> {
    const response = await client.post('/visitors/emergency/resolve', data ?? {});
    return response.data;
}

export const visitorsApi = {
    // Visits
    listVisits,
    getVisit,
    getVisitByCode,
    createVisit,
    updateVisit,
    deleteVisit,
    checkInVisit,
    checkOutVisit,
    approveVisit,
    rejectVisit,
    extendVisit,
    completeInduction,
    // Visitor Types
    listVisitorTypes,
    getVisitorType,
    createVisitorType,
    updateVisitorType,
    deleteVisitorType,
    // Gates
    listGates,
    getGate,
    createGate,
    updateGate,
    deleteGate,
    // Safety Inductions
    listSafetyInductions,
    createSafetyInduction,
    updateSafetyInduction,
    deleteSafetyInduction,
    // VMS Config
    getVmsConfig,
    updateVmsConfig,
    // Watchlist
    listWatchlist,
    createWatchlistEntry,
    updateWatchlistEntry,
    deleteWatchlistEntry,
    checkWatchlist,
    // Denied Entries
    listDeniedEntries,
    getDeniedEntry,
    // Recurring Passes
    listRecurringPasses,
    createRecurringPass,
    updateRecurringPass,
    revokeRecurringPass,
    checkInRecurringPass,
    // Group Visits
    listGroupVisits,
    createGroupVisit,
    updateGroupVisit,
    batchCheckInGroupVisit,
    batchCheckOutGroupVisit,
    // Vehicle Passes
    listVehiclePasses,
    createVehiclePass,
    recordVehicleExit,
    // Material Passes
    listMaterialPasses,
    createMaterialPass,
    returnMaterialPass,
    // Dashboard
    getDashboardToday,
    getDashboardOnSite,
    getDashboardStats,
    // Reports
    getDailyLog,
    getReportSummary,
    getOverstayReport,
    getAnalytics,
    // Emergency
    triggerEmergency,
    getMusterList,
    markSafe,
    resolveEmergency,
};
