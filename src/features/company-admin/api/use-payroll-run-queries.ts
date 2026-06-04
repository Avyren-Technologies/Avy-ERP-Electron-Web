import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollRunApi } from '@/lib/api/payroll-run';

export const payrollRunKeys = {
    all: ['payroll-run'] as const,

    // Payroll Runs
    runs: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'runs', params] as const,
    run: (id: string) =>
        [...payrollRunKeys.all, 'run', id] as const,

    // Payroll Entries
    entries: (runId: string, params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'entries', runId, params] as const,
    entry: (runId: string, entryId: string) =>
        [...payrollRunKeys.all, 'entry', runId, entryId] as const,

    // Payslips
    payslips: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'payslips', params] as const,
    payslip: (id: string) =>
        [...payrollRunKeys.all, 'payslip', id] as const,

    // Salary Holds
    salaryHolds: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'salary-holds', params] as const,

    // Salary Revisions
    salaryRevisions: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'salary-revisions', params] as const,
    salaryRevision: (id: string) =>
        [...payrollRunKeys.all, 'salary-revision', id] as const,

    // Arrears
    arrearEntries: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'arrear-entries', params] as const,

    // Statutory Filings
    statutoryFilings: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'statutory-filings', params] as const,

    // Statutory Dashboard
    statutoryDashboard: () =>
        [...payrollRunKeys.all, 'statutory-dashboard'] as const,

    // Summary endpoints
    fiscalYearKpis: (fyStart?: number) => fyStart != null
        ? [...payrollRunKeys.all, 'fy-kpis', fyStart] as const
        : [...payrollRunKeys.all, 'fy-kpis'] as const,
    attendanceSummary: (runId: string) => [...payrollRunKeys.all, 'attendance-summary', runId] as const,
    attendanceDetail: (runId: string, params?: Record<string, unknown>) =>
        params ? [...payrollRunKeys.all, 'attendance-detail', runId, params] as const
              : [...payrollRunKeys.all, 'attendance-detail', runId] as const,
    computeSummary: (runId: string) => [...payrollRunKeys.all, 'compute-summary', runId] as const,
    statutorySummary: (runId: string) => [...payrollRunKeys.all, 'statutory-summary', runId] as const,
    statutoryFiles: (runId: string) => [...payrollRunKeys.all, 'statutory-files', runId] as const,
    statutoryDetails: (runId: string, category: string) => [...payrollRunKeys.all, 'statutory-details', runId, category] as const,
    computationLog: (runId: string) => [...payrollRunKeys.all, 'computation-log', runId] as const,
    disbursementBreakdown: (runId: string) => [...payrollRunKeys.all, 'disbursement-breakdown', runId] as const,
    approvalSummary: (runId: string) => [...payrollRunKeys.all, 'approval-summary', runId] as const,
    approvalWorkflow: (runId: string) => [...payrollRunKeys.all, 'approval-workflow', runId] as const,
    componentBreakdown: (runId: string) => [...payrollRunKeys.all, 'component-breakdown', runId] as const,
    disbursementSummary: (runId: string) => [...payrollRunKeys.all, 'disbursement-summary', runId] as const,
    disbursementBatches: (runId: string) => [...payrollRunKeys.all, 'disbursement-batches', runId] as const,
    attendanceLockSummary: (runId: string) => [...payrollRunKeys.all, 'attendance-lock-summary', runId] as const,
    attendance: (runId: string) => [...payrollRunKeys.all, 'attendance', runId] as const,
    detail: (runId: string) => [...payrollRunKeys.all, 'detail', runId] as const,

    // Payroll Reports
    salaryRegister: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'salary-register', params] as const,
    bankFile: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'bank-file', params] as const,
    pfECR: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'pf-ecr', params] as const,
    esiChallan: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'esi-challan', params] as const,
    ptChallan: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'pt-challan', params] as const,
    varianceReport: (params?: Record<string, unknown>) =>
        [...payrollRunKeys.all, 'variance', params] as const,
};

// ── Payroll Runs ──

export function usePayrollRuns(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.runs(params),
        queryFn: () => payrollRunApi.listPayrollRuns(params as any),
    });
}

export function usePayrollRun(id: string) {
    return useQuery({
        queryKey: payrollRunKeys.run(id),
        queryFn: () => payrollRunApi.getPayrollRun(id),
        enabled: !!id,
    });
}

// ── Payroll Entries ──

export function usePayrollEntries(runId: string, params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.entries(runId, params),
        queryFn: () => payrollRunApi.listPayrollEntries(runId, params as any),
        enabled: !!runId,
    });
}

export function usePayrollEntry(runId: string, entryId: string) {
    return useQuery({
        queryKey: payrollRunKeys.entry(runId, entryId),
        queryFn: () => payrollRunApi.getPayrollEntry(runId, entryId),
        enabled: !!runId && !!entryId,
    });
}

// ── Payslips ──

export function usePayslips(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.payslips(params),
        queryFn: () => payrollRunApi.listPayslips(params as any),
    });
}

export function usePayslip(id: string) {
    return useQuery({
        queryKey: payrollRunKeys.payslip(id),
        queryFn: () => payrollRunApi.getPayslip(id),
        enabled: !!id,
    });
}

// ── Salary Holds ──

export function useSalaryHolds(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.salaryHolds(params),
        queryFn: () => payrollRunApi.listSalaryHolds(params as any),
    });
}

// ── Salary Revisions ──

export function useSalaryRevisions(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.salaryRevisions(params),
        queryFn: () => payrollRunApi.listSalaryRevisions(params as any),
    });
}

export function useSalaryRevision(id: string) {
    return useQuery({
        queryKey: payrollRunKeys.salaryRevision(id),
        queryFn: () => payrollRunApi.getSalaryRevision(id),
        enabled: !!id,
    });
}

// ── Arrears ──

export function useArrearEntries(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.arrearEntries(params),
        queryFn: () => payrollRunApi.listArrearEntries(params as any),
    });
}

// ── Statutory Filings ──

export function useStatutoryFilings(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.statutoryFilings(params),
        queryFn: () => payrollRunApi.listStatutoryFilings(params as any),
    });
}

// ── Statutory Dashboard ──

export function useStatutoryDashboard() {
    return useQuery({
        queryKey: payrollRunKeys.statutoryDashboard(),
        queryFn: () => payrollRunApi.getStatutoryDashboard(),
    });
}

// ── Payroll Reports ──

export function useSalaryRegister(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.salaryRegister(params),
        queryFn: () => payrollRunApi.getSalaryRegister(params as any),
        enabled: !!params?.month && !!params?.year,
    });
}

export function useBankFile(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.bankFile(params),
        queryFn: () => payrollRunApi.getBankFile(params as any),
        enabled: !!(params?.runId ?? params?.payrollRunId),
    });
}

export function usePFECR(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.pfECR(params),
        queryFn: () => payrollRunApi.getPFECR(params as any),
        enabled: !!params?.month && !!params?.year,
    });
}

export function useESIChallan(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.esiChallan(params),
        queryFn: () => payrollRunApi.getESIChallan(params as any),
        enabled: !!params?.month && !!params?.year,
    });
}

export function usePTChallan(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.ptChallan(params),
        queryFn: () => payrollRunApi.getPTChallan(params as any),
        enabled: !!params?.month && !!params?.year,
    });
}

export function useVarianceReport(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: payrollRunKeys.varianceReport(params),
        queryFn: () => payrollRunApi.getVarianceReport(params as any),
        enabled: !!params?.month && !!params?.year,
    });
}

// ── Summary Queries ──

export function useAttendanceSummary(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.attendanceSummary(runId),
        queryFn: () => payrollRunApi.getAttendanceSummary(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
    });
}

export function useFiscalYearKpis(fyStart?: number) {
    return useQuery({
        queryKey: payrollRunKeys.fiscalYearKpis(fyStart),
        queryFn: () => payrollRunApi.getFiscalYearKpis(fyStart),
        staleTime: 60_000,
        refetchOnMount: true,
    });
}

export function useAttendanceDetail(runId: string, params?: { page?: number; limit?: number; search?: string; department?: string }) {
    return useQuery({
        queryKey: payrollRunKeys.attendanceDetail(runId, params as Record<string, unknown>),
        queryFn: () => payrollRunApi.getAttendanceDetail(runId, params),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
        placeholderData: (prev) => prev,
    });
}

export function useComputeSummary(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.computeSummary(runId),
        queryFn: () => payrollRunApi.getComputeSummary(runId),
        enabled: !!runId,
    });
}

export function useStatutorySummary(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.statutorySummary(runId),
        queryFn: () => payrollRunApi.getStatutorySummary(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
    });
}

export function useStatutoryFiles(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.statutoryFiles(runId),
        queryFn: () => payrollRunApi.getStatutoryFiles(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
    });
}

export function useStatutoryDetails(
    runId: string,
    category: 'PF' | 'ESI' | 'PT' | 'TDS' | 'LWF',
    enabled = true,
) {
    return useQuery({
        queryKey: payrollRunKeys.statutoryDetails(runId, category),
        queryFn: () => payrollRunApi.getStatutoryDetails(runId, category),
        enabled: !!runId && enabled,
        staleTime: 0,
        refetchOnMount: true,
        retry: false,
    });
}

export function useComputationLog(runId: string, enabled = true) {
    return useQuery({
        queryKey: payrollRunKeys.computationLog(runId),
        queryFn: () => payrollRunApi.getComputationLog(runId),
        enabled: !!runId && enabled,
        staleTime: 0,
        refetchOnMount: true,
        retry: false,
    });
}

export function useDisbursementBreakdown(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.disbursementBreakdown(runId),
        queryFn: () => payrollRunApi.getDisbursementBreakdown(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
    });
}

export function useApprovalSummary(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.approvalSummary(runId),
        queryFn: () => payrollRunApi.getApprovalSummary(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
    });
}

export function useApprovalWorkflow(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.approvalWorkflow(runId),
        queryFn: () => payrollRunApi.getApprovalWorkflow(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
        retry: (failureCount, err: any) => {
            // Don't retry on 404 — endpoint or workflow simply not configured
            if (err?.response?.status === 404) return false;
            return failureCount < 1;
        },
    });
}

export function useComponentBreakdown(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.componentBreakdown(runId),
        queryFn: () => payrollRunApi.getComponentBreakdown(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
        retry: (failureCount, err: any) => {
            if (err?.response?.status === 404) return false;
            return failureCount < 1;
        },
    });
}

/** Disbursement summary (Step 6). No retry on 404. */
export function useDisbursementSummary(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.disbursementSummary(runId),
        queryFn: () => payrollRunApi.getDisbursementSummary(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
        retry: (failureCount, err: any) => {
            if (err?.response?.status === 404) return false;
            return failureCount < 1;
        },
    });
}

/** Disbursement batches (Step 6). No retry on 404. */
export function useDisbursementBatches(runId: string) {
    return useQuery({
        queryKey: payrollRunKeys.disbursementBatches(runId),
        queryFn: () => payrollRunApi.getDisbursementBatches(runId),
        enabled: !!runId,
        staleTime: 0,
        refetchOnMount: true,
        retry: (failureCount, err: any) => {
            if (err?.response?.status === 404) return false;
            return failureCount < 1;
        },
    });
}

// ── Step 1 — Bulk attendance mutations ──

/**
 * Step 1: Bulk-lock attendance for selected employees.
 * Invalidates attendance summary, attendance detail, and run detail
 * so the wizard refreshes its state after the mutation succeeds.
 */
export function useBulkLockAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ runId, employeeIds }: { runId: string; employeeIds: string[] }) =>
            payrollRunApi.bulkLockAttendance(runId, employeeIds),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.attendanceSummary(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.attendanceDetail(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.attendanceLockSummary(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.attendance(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.run(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.detail(vars.runId) });
        },
    });
}

/** Step 1: Bulk-unlock attendance for selected employees. */
export function useBulkUnlockAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ runId, employeeIds }: { runId: string; employeeIds: string[] }) =>
            payrollRunApi.bulkUnlockAttendance(runId, employeeIds),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.attendanceSummary(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.attendanceDetail(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.attendanceLockSummary(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.attendance(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.run(vars.runId) });
            queryClient.invalidateQueries({ queryKey: payrollRunKeys.detail(vars.runId) });
        },
    });
}
