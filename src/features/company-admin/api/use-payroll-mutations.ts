import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '@/lib/api/payroll';
import { payrollKeys } from './use-payroll-queries';

// ── Salary Components ──

export function useCreateSalaryComponent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.createSalaryComponent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.salaryComponents() });
        },
    });
}

export function useUpdateSalaryComponent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollApi.updateSalaryComponent(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.salaryComponent(variables.id) });
            queryClient.invalidateQueries({ queryKey: payrollKeys.salaryComponents() });
        },
    });
}

export function useDeleteSalaryComponent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollApi.deleteSalaryComponent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.salaryComponents() });
        },
    });
}

// ── Salary Structures ──

export function useCreateSalaryStructure() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.createSalaryStructure(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.salaryStructures() });
        },
    });
}

export function useUpdateSalaryStructure() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollApi.updateSalaryStructure(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.salaryStructure(variables.id) });
            queryClient.invalidateQueries({ queryKey: payrollKeys.salaryStructures() });
        },
    });
}

export function useDeleteSalaryStructure() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollApi.deleteSalaryStructure(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.salaryStructures() });
        },
    });
}

// ── Employee Salary ──

export function useAssignEmployeeSalary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.assignEmployeeSalary(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.employeeSalaries() });
        },
    });
}

export function useUpdateEmployeeSalary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollApi.updateEmployeeSalary(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.employeeSalary(variables.id) });
            queryClient.invalidateQueries({ queryKey: payrollKeys.employeeSalaries() });
        },
    });
}

// ── Statutory Config — PF ──

export function useUpdatePFConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.updatePFConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.pfConfig() });
        },
    });
}

// ── Statutory Config — ESI ──

export function useUpdateESIConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.updateESIConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.esiConfig() });
        },
    });
}

// ── Statutory Config — PT ──

export function useCreatePTConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.createPTConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.ptConfigs() });
        },
    });
}

export function useUpdatePTConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollApi.updatePTConfig(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.ptConfigs() });
        },
    });
}

export function useDeletePTConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollApi.deletePTConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.ptConfigs() });
        },
    });
}

// ── Statutory Config — Gratuity ──

export function useUpdateGratuityConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.updateGratuityConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.gratuityConfig() });
        },
    });
}

// ── Statutory Config — Bonus ──

export function useUpdateBonusConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.updateBonusConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.bonusConfig() });
        },
    });
}

// ── Statutory Config — LWF ──

export function useCreateLWFConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.createLWFConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.lwfConfigs() });
        },
    });
}

export function useUpdateLWFConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollApi.updateLWFConfig(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.lwfConfigs() });
        },
    });
}

export function useDeleteLWFConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollApi.deleteLWFConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.lwfConfigs() });
        },
    });
}

// ── Bank Config ──

export function useUpdateBankConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.updateBankConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.bankConfig() });
        },
    });
}

// ── Loan Policies ──

export function useCreateLoanPolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.createLoanPolicy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.loanPolicies() });
        },
    });
}

export function useUpdateLoanPolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollApi.updateLoanPolicy(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.loanPolicy(variables.id) });
            queryClient.invalidateQueries({ queryKey: payrollKeys.loanPolicies() });
        },
    });
}

export function useDeleteLoanPolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollApi.deleteLoanPolicy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.loanPolicies() });
        },
    });
}

// ── Loans ──

export function useCreateLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.createLoan(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.loans() });
        },
    });
}

export function useUpdateLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollApi.updateLoan(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.loans() });
        },
    });
}

export function useUpdateLoanStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollApi.updateLoanStatus(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.loans() });
        },
    });
}

// ── Tax Config ──

export function useUpdateTaxConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollApi.updateTaxConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.taxConfig() });
        },
    });
}

// ── Travel Advance ──

export function useCreateTravelAdvance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => payrollApi.createTravelAdvance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.travelAdvances() });
            queryClient.invalidateQueries({ queryKey: payrollKeys.loans() });
        },
    });
}

export function useSettleTravelAdvance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { expenseClaimId: string } }) =>
            payrollApi.settleTravelAdvance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.travelAdvances() });
            queryClient.invalidateQueries({ queryKey: payrollKeys.loans() });
        },
    });
}
