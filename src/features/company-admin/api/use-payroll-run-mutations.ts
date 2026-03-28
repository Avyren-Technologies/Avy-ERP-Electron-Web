import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollRunApi } from '@/lib/api/payroll-run';
import { payrollRunKeys } from './use-payroll-run-queries';

// ── Payroll Runs ──

export function useCreatePayrollRun() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollRunApi.createPayrollRun(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.runs() });
        },
    });
}

/** Step 1: Lock attendance */
export function useLockAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.lockAttendance(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.runs() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.run(id) });
        },
    });
}

/** Step 2: Mark exceptions reviewed */
export function useReviewExceptions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.reviewExceptions(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.runs() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.run(id) });
        },
    });
}

/** Step 3: Compute salaries */
export function useComputeSalaries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.computeSalaries(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.runs() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.run(id) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.entries(id) });
        },
    });
}

/** Step 4: Compute statutory deductions */
export function useComputeStatutory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.computeStatutory(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.runs() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.run(id) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.entries(id) });
        },
    });
}

/** Step 5: Approve payroll run */
export function useApproveRun() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.approveRun(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.runs() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.run(id) });
        },
    });
}

/** Step 6: Disburse & archive */
export function useDisburseRun() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.disburseRun(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.runs() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.run(id) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.payslips() });
        },
    });
}

// ── Payroll Entries ──

export function useOverridePayrollEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ runId, entryId, data }: { runId: string; entryId: string; data: any }) =>
            payrollRunApi.overridePayrollEntry(runId, entryId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.entries(variables.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.entry(variables.runId, variables.entryId) });
        },
    });
}

// ── Payslips ──

export function useEmailPayslip() {
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.emailPayslip(id),
    });
}

export function useGeneratePayslips() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (runId: string) => payrollRunApi.generatePayslips(runId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.payslips() });
        },
    });
}

// ── Salary Holds ──

export function useCreateSalaryHold() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollRunApi.createSalaryHold(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.salaryHolds() });
        },
    });
}

export function useReleaseSalaryHold() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.releaseSalaryHold(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.salaryHolds() });
        },
    });
}

// ── Salary Revisions ──

export function useCreateSalaryRevision() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollRunApi.createSalaryRevision(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.salaryRevisions() });
        },
    });
}

export function useApproveSalaryRevision() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.approveSalaryRevision(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.salaryRevisions() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.salaryRevision(id) });
        },
    });
}

export function useApplySalaryRevision() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.applySalaryRevision(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.salaryRevisions() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.salaryRevision(id) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.arrearEntries() });
        },
    });
}

// ── Statutory Filings ──

export function useCreateStatutoryFiling() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollRunApi.createStatutoryFiling(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.statutoryFilings() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.statutoryDashboard() });
        },
    });
}

export function useUpdateStatutoryFiling() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            payrollRunApi.updateStatutoryFiling(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.statutoryFilings() });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.statutoryDashboard() });
        },
    });
}

// ── Form 16 / 24Q ──

export function useGenerateForm16() {
    return useMutation({
        mutationFn: (data: { financialYear: string }) => payrollRunApi.generateForm16(data),
    });
}

export function useGenerateForm24Q() {
    return useMutation({
        mutationFn: (data: { quarter: number; financialYear: string }) => payrollRunApi.generateForm24Q(data),
    });
}

export function useBulkEmailForm16() {
    return useMutation({
        mutationFn: (data: { financialYear: string }) => payrollRunApi.bulkEmailForm16(data),
    });
}
