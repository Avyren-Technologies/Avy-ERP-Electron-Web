import { client } from './client';
import type { ApiResponse } from './auth';

// ── Salary Components ──

async function listSalaryComponents(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/salary-components', { params });
    return response.data;
}

async function getSalaryComponent(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/salary-components/${id}`);
    return response.data;
}

async function createSalaryComponent(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/salary-components', data);
    return response.data;
}

async function updateSalaryComponent(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/salary-components/${id}`, data);
    return response.data;
}

async function deleteSalaryComponent(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/salary-components/${id}`);
    return response.data;
}

// ── Salary Structures ──

async function listSalaryStructures(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/salary-structures', { params });
    return response.data;
}

async function getSalaryStructure(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/salary-structures/${id}`);
    return response.data;
}

async function createSalaryStructure(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/salary-structures', data);
    return response.data;
}

async function updateSalaryStructure(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/salary-structures/${id}`, data);
    return response.data;
}

async function deleteSalaryStructure(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/salary-structures/${id}`);
    return response.data;
}

// ── Employee Salary ──

async function listEmployeeSalaries(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/employee-salaries', { params });
    return response.data;
}

async function getEmployeeSalary(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/employee-salaries/${id}`);
    return response.data;
}

async function assignEmployeeSalary(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/employee-salaries', data);
    return response.data;
}

async function updateEmployeeSalary(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/employee-salaries/${id}`, data);
    return response.data;
}

// ── Statutory Config — PF ──

async function getPFConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/pf-config');
    return response.data;
}

async function updatePFConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/payroll/pf-config', data);
    return response.data;
}

// ── Statutory Config — ESI ──

async function getESIConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/esi-config');
    return response.data;
}

async function updateESIConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/payroll/esi-config', data);
    return response.data;
}

// ── Statutory Config — PT (multi-state) ──

async function listPTConfigs(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/pt-configs', { params });
    return response.data;
}

async function createPTConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/payroll/pt-configs', data);
    return response.data;
}

async function updatePTConfig(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll/pt-configs/${id}`, data);
    return response.data;
}

async function deletePTConfig(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/payroll/pt-configs/${id}`);
    return response.data;
}

// ── Statutory Config — Gratuity ──

async function getGratuityConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/gratuity-config');
    return response.data;
}

async function updateGratuityConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/payroll/gratuity-config', data);
    return response.data;
}

// ── Statutory Config — Bonus ──

async function getBonusConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/bonus-config');
    return response.data;
}

async function updateBonusConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/payroll/bonus-config', data);
    return response.data;
}

// ── Statutory Config — LWF (multi-state) ──

async function listLWFConfigs(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/lwf-configs', { params });
    return response.data;
}

async function createLWFConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/payroll/lwf-configs', data);
    return response.data;
}

async function updateLWFConfig(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/payroll/lwf-configs/${id}`, data);
    return response.data;
}

async function deleteLWFConfig(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/payroll/lwf-configs/${id}`);
    return response.data;
}

// ── Bank Config ──

async function getBankConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/bank-config');
    return response.data;
}

async function updateBankConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/payroll/bank-config', data);
    return response.data;
}

// ── Loan Policies ──

async function listLoanPolicies(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/loan-policies', { params });
    return response.data;
}

async function getLoanPolicy(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/loan-policies/${id}`);
    return response.data;
}

async function createLoanPolicy(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/loan-policies', data);
    return response.data;
}

async function updateLoanPolicy(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/loan-policies/${id}`, data);
    return response.data;
}

async function deleteLoanPolicy(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/loan-policies/${id}`);
    return response.data;
}

// ── Loan Records ──

async function listLoans(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/loans', { params });
    return response.data;
}

async function createLoan(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/loans', data);
    return response.data;
}

async function updateLoan(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/loans/${id}`, data);
    return response.data;
}

async function updateLoanStatus(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/loans/${id}/status`, data);
    return response.data;
}

// ── Tax Config ──

async function getTaxConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/payroll/tax-config');
    return response.data;
}

async function updateTaxConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/payroll/tax-config', data);
    return response.data;
}

// ── Travel Advance ──

async function createTravelAdvance(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/loans/travel-advance', data);
    return response.data;
}

async function listTravelAdvances(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/loans/travel-advances', { params });
    return response.data;
}

async function settleTravelAdvance(id: string, data: { expenseClaimId: string }): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/loans/${id}/settle-travel`, data);
    return response.data;
}

export const payrollApi = {
    // Salary Components
    listSalaryComponents,
    getSalaryComponent,
    createSalaryComponent,
    updateSalaryComponent,
    deleteSalaryComponent,
    // Salary Structures
    listSalaryStructures,
    getSalaryStructure,
    createSalaryStructure,
    updateSalaryStructure,
    deleteSalaryStructure,
    // Employee Salary
    listEmployeeSalaries,
    getEmployeeSalary,
    assignEmployeeSalary,
    updateEmployeeSalary,
    // Statutory Config — PF
    getPFConfig,
    updatePFConfig,
    // Statutory Config — ESI
    getESIConfig,
    updateESIConfig,
    // Statutory Config — PT
    listPTConfigs,
    createPTConfig,
    updatePTConfig,
    deletePTConfig,
    // Statutory Config — Gratuity
    getGratuityConfig,
    updateGratuityConfig,
    // Statutory Config — Bonus
    getBonusConfig,
    updateBonusConfig,
    // Statutory Config — LWF
    listLWFConfigs,
    createLWFConfig,
    updateLWFConfig,
    deleteLWFConfig,
    // Bank Config
    getBankConfig,
    updateBankConfig,
    // Loan Policies
    listLoanPolicies,
    getLoanPolicy,
    createLoanPolicy,
    updateLoanPolicy,
    deleteLoanPolicy,
    // Loans
    listLoans,
    createLoan,
    updateLoan,
    updateLoanStatus,
    // Tax Config
    getTaxConfig,
    updateTaxConfig,
    // Travel Advance
    createTravelAdvance,
    listTravelAdvances,
    settleTravelAdvance,
};
