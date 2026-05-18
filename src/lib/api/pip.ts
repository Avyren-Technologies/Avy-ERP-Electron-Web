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
  operationNumber: string;
  name: string;
  processType: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  operation?: { id: string; code: string; name: string; operationNumber: string; processType: string };
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
    listOperations,
    getOperation,
    createOperation,
    updateOperation,
    deleteOperation,
};
