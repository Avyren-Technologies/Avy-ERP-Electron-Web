import { useQuery } from '@tanstack/react-query';
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
        enabled: !!params?.payrollRunId,
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
