import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { payrollRunApi } from '@/lib/api/payroll-run';
import { payrollRunKeys } from './use-payroll-run-queries';

/**
 * Invalidate every cache that depends on a payroll-run's state.
 * Any wizard mutation should call this with the affected runId so that
 * the list view, run detail, KPI strip, attendance/compute/statutory/approval
 * summaries, and statutory files all stay in sync.
 */
function invalidateRunCaches(qc: QueryClient, runId?: string) {
    qc.invalidateQueries({ queryKey: payrollRunKeys.runs() });
    qc.invalidateQueries({ queryKey: payrollRunKeys.fiscalYearKpis() });
    if (runId) {
        qc.invalidateQueries({ queryKey: payrollRunKeys.run(runId) });
        qc.invalidateQueries({ queryKey: payrollRunKeys.entries(runId) });
        qc.invalidateQueries({ queryKey: payrollRunKeys.attendanceSummary(runId) });
        qc.invalidateQueries({ queryKey: payrollRunKeys.attendanceDetail(runId) });
        qc.invalidateQueries({ queryKey: payrollRunKeys.computeSummary(runId) });
        qc.invalidateQueries({ queryKey: payrollRunKeys.statutorySummary(runId) });
        qc.invalidateQueries({ queryKey: payrollRunKeys.statutoryFiles(runId) });
        qc.invalidateQueries({ queryKey: payrollRunKeys.approvalSummary(runId) });
        qc.invalidateQueries({ queryKey: payrollRunKeys.disbursementBreakdown(runId) });
    }
}

// ── Payroll Runs ──

export function useCreatePayrollRun() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => payrollRunApi.createPayrollRun(data),
        onSuccess: () => {
            invalidateRunCaches(queryClient);
        },
    });
}

export function useDeletePayrollRun() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.deletePayrollRun(id),
        onSuccess: (_, id) => {
            invalidateRunCaches(queryClient, id);
            queryClient.removeQueries({ queryKey: payrollRunKeys.run(id) });
        },
    });
}

/** Step 1: Lock attendance */
export function useLockAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.lockAttendance(id),
        onSuccess: (_, id) => invalidateRunCaches(queryClient, id),
    });
}

/** Step 2: Mark exceptions reviewed */
export function useReviewExceptions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.reviewExceptions(id),
        onSuccess: (_, id) => invalidateRunCaches(queryClient, id),
    });
}

/** Step 2: Resolve a single exception (action: RESOLVE / SKIP) */
export function useResolveException() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ runId, exceptionIndex, action, note }: { runId: string; exceptionIndex: number; action: 'RESOLVE' | 'SKIP'; note?: string }) =>
            payrollRunApi.resolveException(runId, exceptionIndex, action, note),
        onSuccess: (_, vars) => invalidateRunCaches(queryClient, vars.runId),
    });
}

/** Step 3: Compute salaries */
export function useComputeSalaries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.computeSalaries(id),
        onSuccess: (_, id) => invalidateRunCaches(queryClient, id),
    });
}

/** Step 4: Compute statutory deductions */
export function useComputeStatutory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.computeStatutory(id),
        onSuccess: (_, id) => invalidateRunCaches(queryClient, id),
    });
}

/** Step 5: Approve payroll run */
export function useApproveRun() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.approveRun(id),
        onSuccess: (_, id) => invalidateRunCaches(queryClient, id),
    });
}

/** Step 5: Save approval notes (no status change) */
export function useSaveApprovalNotes() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ runId, notes }: { runId: string; notes: string }) =>
            payrollRunApi.saveApprovalNotes(runId, notes),
        onSuccess: (_, vars) => invalidateRunCaches(queryClient, vars.runId),
    });
}

/** Step 6: Disburse & archive */
export function useDisburseRun() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.disburseRun(id),
        onSuccess: (_, id) => {
            invalidateRunCaches(queryClient, id);
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.payslips() });
        },
    });
}

/** Step 6: Archive the run (separate from disburse) */
export function useArchiveRun() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ runId, payload }: { runId: string; payload?: Record<string, unknown> }) =>
            payrollRunApi.archiveRun(runId, payload),
        onSuccess: (_, vars) => invalidateRunCaches(queryClient, vars.runId),
    });
}

/** Reset to compute step (re-compute) */
export function useResetToCompute() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => payrollRunApi.resetToCompute(id),
        onSuccess: (_, id) => invalidateRunCaches(queryClient, id),
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
