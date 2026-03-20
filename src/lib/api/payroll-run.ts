import { client } from './client';
import type { ApiResponse } from './auth';

// ── Payroll Runs ──

async function listPayrollRuns(params?: {
    page?: number;
    limit?: number;
    year?: number;
    month?: number;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll-runs', { params });
    return response.data;
}

async function createPayrollRun(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/payroll-runs', data);
    return response.data;
}

async function getPayrollRun(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/payroll-runs/${id}`);
    return response.data;
}

// 6-step wizard actions
async function lockAttendance(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll-runs/${id}/lock-attendance`);
    return response.data;
}

async function reviewExceptions(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll-runs/${id}/review-exceptions`);
    return response.data;
}

async function computeSalaries(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll-runs/${id}/compute`);
    return response.data;
}

async function computeStatutory(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll-runs/${id}/statutory`);
    return response.data;
}

async function approveRun(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll-runs/${id}/approve`);
    return response.data;
}

async function disburseRun(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll-runs/${id}/disburse`);
    return response.data;
}

// ── Payroll Entries ──

async function listPayrollEntries(runId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    isException?: boolean;
}): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/payroll-runs/${runId}/entries`, { params });
    return response.data;
}

async function getPayrollEntry(runId: string, entryId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/payroll-runs/${runId}/entries/${entryId}`);
    return response.data;
}

async function overridePayrollEntry(runId: string, entryId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll-runs/${runId}/entries/${entryId}`, data);
    return response.data;
}

// ── Payslips ──

async function listPayslips(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    month?: number;
    year?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payslips', { params });
    return response.data;
}

async function getPayslip(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/payslips/${id}`);
    return response.data;
}

async function emailPayslip(id: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/payslips/${id}/email`);
    return response.data;
}

async function generatePayslips(runId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/payroll-runs/${runId}/generate-payslips`);
    return response.data;
}

// ── Salary Holds ──

async function listSalaryHolds(params?: {
    page?: number;
    limit?: number;
    payrollRunId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/salary-holds', { params });
    return response.data;
}

async function createSalaryHold(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/salary-holds', data);
    return response.data;
}

async function releaseSalaryHold(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/salary-holds/${id}/release`);
    return response.data;
}

// ── Salary Revisions ──

async function listSalaryRevisions(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/salary-revisions', { params });
    return response.data;
}

async function createSalaryRevision(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/salary-revisions', data);
    return response.data;
}

async function getSalaryRevision(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/salary-revisions/${id}`);
    return response.data;
}

async function approveSalaryRevision(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/salary-revisions/${id}/approve`);
    return response.data;
}

async function applySalaryRevision(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/salary-revisions/${id}/apply`);
    return response.data;
}

// ── Arrears ──

async function listArrearEntries(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    payrollRunId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/arrear-entries', { params });
    return response.data;
}

// ── Statutory Filings ──

async function listStatutoryFilings(params?: {
    page?: number;
    limit?: number;
    year?: number;
    type?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/statutory-filings', { params });
    return response.data;
}

async function createStatutoryFiling(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/statutory-filings', data);
    return response.data;
}

async function updateStatutoryFiling(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/statutory-filings/${id}`, data);
    return response.data;
}

// ── Statutory Dashboard ──

async function getStatutoryDashboard(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/statutory/dashboard');
    return response.data;
}

// ── Payroll Reports ──

async function getSalaryRegister(params?: {
    month?: number;
    year?: number;
    payrollRunId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll-reports/salary-register', { params });
    return response.data;
}

async function getBankFile(params?: {
    month?: number;
    year?: number;
    payrollRunId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll-reports/bank-file', { params });
    return response.data;
}

async function getPFECR(params?: {
    month?: number;
    year?: number;
    payrollRunId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll-reports/pf-ecr', { params });
    return response.data;
}

async function getESIChallan(params?: {
    month?: number;
    year?: number;
    payrollRunId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll-reports/esi-challan', { params });
    return response.data;
}

async function getPTChallan(params?: {
    month?: number;
    year?: number;
    payrollRunId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll-reports/pt-challan', { params });
    return response.data;
}

async function getVarianceReport(params?: {
    month?: number;
    year?: number;
    payrollRunId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll-reports/variance', { params });
    return response.data;
}

export const payrollRunApi = {
    // Payroll Runs
    listPayrollRuns,
    createPayrollRun,
    getPayrollRun,
    // 6-step wizard
    lockAttendance,
    reviewExceptions,
    computeSalaries,
    computeStatutory,
    approveRun,
    disburseRun,
    // Payroll Entries
    listPayrollEntries,
    getPayrollEntry,
    overridePayrollEntry,
    // Payslips
    listPayslips,
    getPayslip,
    emailPayslip,
    generatePayslips,
    // Salary Holds
    listSalaryHolds,
    createSalaryHold,
    releaseSalaryHold,
    // Salary Revisions
    listSalaryRevisions,
    createSalaryRevision,
    getSalaryRevision,
    approveSalaryRevision,
    applySalaryRevision,
    // Arrears
    listArrearEntries,
    // Statutory Filings
    listStatutoryFilings,
    createStatutoryFiling,
    updateStatutoryFiling,
    // Statutory Dashboard
    getStatutoryDashboard,
    // Payroll Reports
    getSalaryRegister,
    getBankFile,
    getPFECR,
    getESIChallan,
    getPTChallan,
    getVarianceReport,
};
