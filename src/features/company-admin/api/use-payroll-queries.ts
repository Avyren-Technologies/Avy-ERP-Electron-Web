import { useQuery } from '@tanstack/react-query';
import { payrollApi } from '@/lib/api/payroll';

export const payrollKeys = {
    all: ['payroll'] as const,

    // Salary Components
    salaryComponents: (params?: Record<string, unknown>) =>
        [...payrollKeys.all, 'salary-components', params] as const,
    salaryComponent: (id: string) =>
        [...payrollKeys.all, 'salary-component', id] as const,

    // Salary Structures
    salaryStructures: (params?: Record<string, unknown>) =>
        [...payrollKeys.all, 'salary-structures', params] as const,
    salaryStructure: (id: string) =>
        [...payrollKeys.all, 'salary-structure', id] as const,

    // Employee Salary
    employeeSalaries: (params?: Record<string, unknown>) =>
        [...payrollKeys.all, 'employee-salaries', params] as const,
    employeeSalary: (id: string) =>
        [...payrollKeys.all, 'employee-salary', id] as const,

    // Statutory Configs (singletons)
    pfConfig: () => [...payrollKeys.all, 'pf-config'] as const,
    esiConfig: () => [...payrollKeys.all, 'esi-config'] as const,
    gratuityConfig: () => [...payrollKeys.all, 'gratuity-config'] as const,
    bonusConfig: () => [...payrollKeys.all, 'bonus-config'] as const,

    // Statutory Configs (multi-state)
    ptConfigs: (params?: Record<string, unknown>) =>
        [...payrollKeys.all, 'pt-configs', params] as const,
    lwfConfigs: (params?: Record<string, unknown>) =>
        [...payrollKeys.all, 'lwf-configs', params] as const,

    // Bank Config
    bankConfig: () => [...payrollKeys.all, 'bank-config'] as const,

    // Loan Policies
    loanPolicies: (params?: Record<string, unknown>) =>
        [...payrollKeys.all, 'loan-policies', params] as const,
    loanPolicy: (id: string) =>
        [...payrollKeys.all, 'loan-policy', id] as const,

    // Loans
    loans: (params?: Record<string, unknown>) =>
        [...payrollKeys.all, 'loans', params] as const,

    // Tax Config
    taxConfig: () => [...payrollKeys.all, 'tax-config'] as const,
};

// ── Salary Components ──

export function useSalaryComponents(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollKeys.salaryComponents(params),
        queryFn: () => payrollApi.listSalaryComponents(params as any),
    });
}

export function useSalaryComponent(id: string) {
    return useQuery({
        queryKey: payrollKeys.salaryComponent(id),
        queryFn: () => payrollApi.getSalaryComponent(id),
        enabled: !!id,
    });
}

// ── Salary Structures ──

export function useSalaryStructures(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollKeys.salaryStructures(params),
        queryFn: () => payrollApi.listSalaryStructures(params as any),
    });
}

export function useSalaryStructure(id: string) {
    return useQuery({
        queryKey: payrollKeys.salaryStructure(id),
        queryFn: () => payrollApi.getSalaryStructure(id),
        enabled: !!id,
    });
}

// ── Employee Salary ──

export function useEmployeeSalaries(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollKeys.employeeSalaries(params),
        queryFn: () => payrollApi.listEmployeeSalaries(params as any),
    });
}

export function useEmployeeSalary(id: string) {
    return useQuery({
        queryKey: payrollKeys.employeeSalary(id),
        queryFn: () => payrollApi.getEmployeeSalary(id),
        enabled: !!id,
    });
}

// ── Statutory Configs ──

export function usePFConfig() {
    return useQuery({
        queryKey: payrollKeys.pfConfig(),
        queryFn: () => payrollApi.getPFConfig(),
    });
}

export function useESIConfig() {
    return useQuery({
        queryKey: payrollKeys.esiConfig(),
        queryFn: () => payrollApi.getESIConfig(),
    });
}

export function usePTConfigs(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollKeys.ptConfigs(params),
        queryFn: () => payrollApi.listPTConfigs(params as any),
    });
}

export function useGratuityConfig() {
    return useQuery({
        queryKey: payrollKeys.gratuityConfig(),
        queryFn: () => payrollApi.getGratuityConfig(),
    });
}

export function useBonusConfig() {
    return useQuery({
        queryKey: payrollKeys.bonusConfig(),
        queryFn: () => payrollApi.getBonusConfig(),
    });
}

export function useLWFConfigs(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollKeys.lwfConfigs(params),
        queryFn: () => payrollApi.listLWFConfigs(params as any),
    });
}

// ── Bank Config ──

export function useBankConfig() {
    return useQuery({
        queryKey: payrollKeys.bankConfig(),
        queryFn: () => payrollApi.getBankConfig(),
    });
}

// ── Loan Policies ──

export function useLoanPolicies(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollKeys.loanPolicies(params),
        queryFn: () => payrollApi.listLoanPolicies(params as any),
    });
}

export function useLoanPolicy(id: string) {
    return useQuery({
        queryKey: payrollKeys.loanPolicy(id),
        queryFn: () => payrollApi.getLoanPolicy(id),
        enabled: !!id,
    });
}

// ── Loans ──

export function useLoans(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollKeys.loans(params),
        queryFn: () => payrollApi.listLoans(params as any),
    });
}

// ── Tax Config ──

export function useTaxConfig() {
    return useQuery({
        queryKey: payrollKeys.taxConfig(),
        queryFn: () => payrollApi.getTaxConfig(),
    });
}
