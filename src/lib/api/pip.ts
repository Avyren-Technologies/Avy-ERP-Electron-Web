import { client } from './client';
import type { ApiResponse } from './auth';

// ---------- Types ----------

export interface SlabTier {
  fromQty: number;
  toQty: number | null;
  ratePerPiece: number;
}

export interface Operation {
  id: string;
  companyId: string;
  code: string;
  name: string;
  processType?: string;  // legacy, keep for backward compat
  processCategoryId?: string;
  processCategory?: { id: string; name: string; code?: string };
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessCategory {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export interface DowntimeReason {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export interface PipSlabConfig {
  id: string;
  companyId: string;
  locationId?: string;
  machineId: string;
  machine?: { id: string; assetCode: string; assetName: string };
  partId: string;
  part?: { id: string; partNumber: string; name: string };
  operationId: string;
  operation?: { id: string; code: string; name: string; processType?: string; processCategoryId?: string; processCategory?: { id: string; name: string } };
  shiftTargetQty: number;
  slabTiers: SlabTier[];
  isActive: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipDailyEntry {
  id: string;
  companyId: string;
  locationId?: string;
  entryDate: string;
  shiftId: string;
  operatorId: string;
  sessionRef?: string;
  machineId: string;
  partId: string;
  slabConfigId?: string;
  operationId?: string;
  operation?: { id: string; code: string; name: string };
  qtyProduced: number;
  shiftTargetQty: number;
  achievementPct: number;
  ncCount: number;
  ncReason?: string;
  downtimeReasonId?: string;
  downtimeMinutes?: number;
  downtimeReason?: { id: string; name: string; code?: string };
  methodUsed?: string;
  methodNumber?: number;
  cumulativeRatio?: number;
  isEligible: boolean;
  incentiveAmount: number;
  totalIncentive: number;
  calcBreakdown?: Record<string, unknown>;
  status: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Included relations (populated by backend when listing entries)
  operator?: { id: string; firstName: string; lastName: string; employeeId: string };
  slabConfig?: {
    id: string;
    machine?: { id: string; assetCode: string; assetName: string };
    part?: { id: string; partNumber: string; name: string };
  };
}

export interface PipIncentiveConfig {
  id: string;
  companyId: string;
  method1Enabled: boolean;
  method1Name: string;
  method2Enabled: boolean;
  method2Name: string;
  differentiateExtraHours: boolean;
  defaultShiftHours: number;
  extraHoursWarnThreshold: number;
  splitExtraHoursEarning: boolean;
  extraHoursEarningCode: string;
}

export interface PipExtraHoursEntry {
  id: string;
  companyId: string;
  locationId?: string;
  entryDate: string;
  shiftId: string;
  operatorId: string;
  sessionRef?: string;
  machineId: string;
  partId: string;
  slabConfigId: string;
  operationId?: string;
  extraHoursWorked: number;
  shiftHours: number;
  shiftTargetQty: number;
  hourlyRate: number;
  extraHoursTarget: number;
  qtyProduced: number;
  incentiveQty: number;
  slab1Rate: number;
  incentiveAmount: number;
  calcBreakdown?: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Included relations (populated by backend when listing entries)
  operator?: { id: string; firstName: string; lastName: string; employeeId: string };
  slabConfig?: {
    id: string;
    machine?: { id: string; assetCode: string; assetName: string };
    part?: { id: string; partNumber: string; name: string };
  };
}

export interface ExtraHoursResult {
  totalIncentive: number;
  extraHoursWorked: number;
  shiftHours: number;
  parts: Array<{
    partId: string;
    partNumber: string;
    partName: string;
    machineId: string;
    machineCode: string;
    qtyProduced: number;
    shiftTargetQty: number;
    slab1Rate: number;
    hourlyRate: number;
    extraHoursTarget: number;
    incentiveQty: number;
    incentiveAmount: number;
    breakdown: string;
  }>;
}

export interface SaveExtraHoursEntriesPayload {
  entryDate: string;
  shiftId: string;
  operatorId: string;
  sessionRef?: string;
  locationId?: string;
  extraHoursWorked: number;
  entries: Array<{
    machineId: string;
    partId: string;
    slabConfigId: string;
    operationId?: string;
    qtyProduced: number;
  }>;
}

export interface PipMonthlyReport {
  id: string;
  companyId: string;
  locationId?: string;
  month: number;
  year: number;
  status: string;
  totalIncentive: number;
  operatorCount: number;
  workingDays: number;
  avgPerDay: number;
  maxSingleDay: number;
  maxSingleDayDate?: string;
  operatorSummary?: Record<string, unknown>[];
  partSummary?: Record<string, unknown>[];
  dailyTrend?: Record<string, unknown>[];
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  payrollRunId?: string;
  mergedAt?: string;
}

export interface PipDashboardMetrics {
  partCount: number;
  machineCount: number;
  slabConfigCount: number;
  todayIncentive: number;
  todayOperatorCount: number;
}

export interface CalculationResult {
  totalIncentive: number;
  cumulativeRatio: number;
  isEligible: boolean;
  methodUsed: string;
  methodNumber: number;
  parts: Array<{
    partId: string;
    partNumber: string;
    partName: string;
    machineId: string;
    machineCode: string;
    qtyProduced: number;
    shiftTargetQty: number;
    achievementPct: number;
    earningQty: number;
    incentiveAmount: number;
    breakdown: string;
    case: string;
    milestone?: number;
  }>;
}

// ---------- PIP API ----------

// Config
async function getConfig(): Promise<ApiResponse<PipIncentiveConfig>> {
    const response = await client.get('/production/pip/config');
    return response.data;
}

async function updateConfig(data: Record<string, unknown>): Promise<ApiResponse<PipIncentiveConfig>> {
    const response = await client.patch('/production/pip/config', data);
    return response.data;
}

// Slab Configs
async function listSlabConfigs(params?: Record<string, unknown>): Promise<ApiResponse<PipSlabConfig[]>> {
    const response = await client.get('/production/pip/slab-configs', { params });
    return response.data;
}

async function getSlabConfig(id: string): Promise<ApiResponse<PipSlabConfig>> {
    const response = await client.get(`/production/pip/slab-configs/${id}`);
    return response.data;
}

async function createSlabConfig(data: Record<string, unknown>): Promise<ApiResponse<PipSlabConfig>> {
    const response = await client.post('/production/pip/slab-configs', data);
    return response.data;
}

async function bulkCreateSlabConfigs(data: Record<string, unknown>): Promise<ApiResponse<{ createdCount: number; skippedCount: number; skipped: { machineCode: string; partNumber: string; reason: string }[] }>> {
    const response = await client.post('/production/pip/slab-configs/bulk', data);
    return response.data;
}

async function updateSlabConfig(id: string, data: Record<string, unknown>): Promise<ApiResponse<PipSlabConfig>> {
    const response = await client.patch(`/production/pip/slab-configs/${id}`, data);
    return response.data;
}

async function deleteSlabConfig(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/production/pip/slab-configs/${id}`);
    return response.data;
}

// Daily Entries
async function saveDailyEntries(data: Record<string, unknown>): Promise<ApiResponse<PipDailyEntry[]>> {
    const response = await client.post('/production/pip/daily-entries', data);
    return response.data;
}

async function listDailyEntries(params?: Record<string, unknown>): Promise<ApiResponse<PipDailyEntry[]>> {
    const response = await client.get('/production/pip/daily-entries', { params });
    return response.data;
}

async function getDailyEntrySummary(params?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await client.get('/production/pip/daily-entries/summary', { params });
    return response.data;
}

async function deleteDailyEntries(sessionRef: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/production/pip/daily-entries/${sessionRef}`);
    return response.data;
}

// Calculator
async function simulateIncentive(data: Record<string, unknown>): Promise<ApiResponse<CalculationResult>> {
    const response = await client.post('/production/pip/calculate', data);
    return response.data;
}

// Dashboard
async function getDashboardMetrics(params?: Record<string, unknown>): Promise<ApiResponse<PipDashboardMetrics>> {
    const response = await client.get('/production/pip/dashboard', { params });
    return response.data;
}

// Monthly Reports
async function generateMonthlyReport(data: Record<string, unknown>): Promise<ApiResponse<PipMonthlyReport>> {
    const response = await client.post('/production/pip/monthly-reports/generate', data);
    return response.data;
}

async function listMonthlyReports(params?: Record<string, unknown>): Promise<ApiResponse<PipMonthlyReport[]>> {
    const response = await client.get('/production/pip/monthly-reports', { params });
    return response.data;
}

async function getMonthlyReport(id: string): Promise<ApiResponse<PipMonthlyReport>> {
    const response = await client.get(`/production/pip/monthly-reports/${id}`);
    return response.data;
}

async function submitMonthlyReport(id: string): Promise<ApiResponse<PipMonthlyReport>> {
    const response = await client.post(`/production/pip/monthly-reports/${id}/submit`);
    return response.data;
}

async function approveMonthlyReport(id: string): Promise<ApiResponse<PipMonthlyReport>> {
    const response = await client.patch(`/production/pip/monthly-reports/${id}/approve`);
    return response.data;
}

async function rejectMonthlyReport(id: string, data: Record<string, unknown>): Promise<ApiResponse<PipMonthlyReport>> {
    const response = await client.patch(`/production/pip/monthly-reports/${id}/reject`, data);
    return response.data;
}

// Payroll
async function mergeToPayroll(id: string, data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await client.post(`/production/pip/monthly-reports/${id}/merge`, data);
    return response.data;
}

async function previewPayrollMerge(id: string): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await client.get(`/production/pip/monthly-reports/${id}/merge-preview`);
    return response.data;
}

async function reversePayrollMerge(id: string): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await client.post(`/production/pip/monthly-reports/${id}/reverse`);
    return response.data;
}

// Extra Hours Entries
async function saveExtraHoursEntries(data: SaveExtraHoursEntriesPayload): Promise<ApiResponse<{ sessionRef: string; entries: PipExtraHoursEntry[]; calculation: ExtraHoursResult }>> {
    const response = await client.post('/production/pip/extra-hours-entries', data);
    return response.data;
}

async function listExtraHoursEntries(params?: { page?: number; limit?: number; entryDate?: string; shiftId?: string; operatorId?: string; machineId?: string; partId?: string; status?: string; locationId?: string }): Promise<ApiResponse<PipExtraHoursEntry[]>> {
    const response = await client.get('/production/pip/extra-hours-entries', { params });
    return response.data;
}

async function deleteExtraHoursEntries(sessionRef: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/production/pip/extra-hours-entries/${sessionRef}`);
    return response.data;
}

// Process Categories
async function listProcessCategories(params?: Record<string, unknown>): Promise<ApiResponse<ProcessCategory[]>> {
    const response = await client.get('/production/pip/process-categories', { params });
    return response.data;
}

async function createProcessCategory(data: Record<string, unknown>): Promise<ApiResponse<ProcessCategory>> {
    const response = await client.post('/production/pip/process-categories', data);
    return response.data;
}

async function updateProcessCategory(id: string, data: Record<string, unknown>): Promise<ApiResponse<ProcessCategory>> {
    const response = await client.patch(`/production/pip/process-categories/${id}`, data);
    return response.data;
}

async function deleteProcessCategory(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/production/pip/process-categories/${id}`);
    return response.data;
}

// Downtime Reasons
async function listDowntimeReasons(params?: Record<string, unknown>): Promise<ApiResponse<DowntimeReason[]>> {
    const response = await client.get('/production/pip/downtime-reasons', { params });
    return response.data;
}

async function createDowntimeReason(data: Record<string, unknown>): Promise<ApiResponse<DowntimeReason>> {
    const response = await client.post('/production/pip/downtime-reasons', data);
    return response.data;
}

async function updateDowntimeReason(id: string, data: Record<string, unknown>): Promise<ApiResponse<DowntimeReason>> {
    const response = await client.patch(`/production/pip/downtime-reasons/${id}`, data);
    return response.data;
}

async function deleteDowntimeReason(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/production/pip/downtime-reasons/${id}`);
    return response.data;
}

// Operations
async function listOperations(params?: Record<string, unknown>): Promise<ApiResponse<Operation[]>> {
    const response = await client.get('/production/pip/operations', { params });
    return response.data;
}

async function getOperation(id: string): Promise<ApiResponse<Operation>> {
    const response = await client.get(`/production/pip/operations/${id}`);
    return response.data;
}

async function createOperation(data: Record<string, unknown>): Promise<ApiResponse<Operation>> {
    const response = await client.post('/production/pip/operations', data);
    return response.data;
}

async function updateOperation(id: string, data: Record<string, unknown>): Promise<ApiResponse<Operation>> {
    const response = await client.patch(`/production/pip/operations/${id}`, data);
    return response.data;
}

async function deleteOperation(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/production/pip/operations/${id}`);
    return response.data;
}

export const pipApi = {
    getConfig,
    updateConfig,
    listSlabConfigs,
    getSlabConfig,
    createSlabConfig,
    bulkCreateSlabConfigs,
    updateSlabConfig,
    deleteSlabConfig,
    saveDailyEntries,
    listDailyEntries,
    getDailyEntrySummary,
    deleteDailyEntries,
    saveExtraHoursEntries,
    listExtraHoursEntries,
    deleteExtraHoursEntries,
    simulateIncentive,
    getDashboardMetrics,
    generateMonthlyReport,
    listMonthlyReports,
    getMonthlyReport,
    submitMonthlyReport,
    approveMonthlyReport,
    rejectMonthlyReport,
    mergeToPayroll,
    previewPayrollMerge,
    reversePayrollMerge,
    listProcessCategories,
    createProcessCategory,
    updateProcessCategory,
    deleteProcessCategory,
    listDowntimeReasons,
    createDowntimeReason,
    updateDowntimeReason,
    deleteDowntimeReason,
    listOperations,
    getOperation,
    createOperation,
    updateOperation,
    deleteOperation,
};
