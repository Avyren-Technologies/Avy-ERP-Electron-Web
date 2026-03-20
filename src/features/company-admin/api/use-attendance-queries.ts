import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api/attendance';

export const attendanceKeys = {
    all: ['attendance'] as const,
    records: (params?: Record<string, unknown>) => [...attendanceKeys.all, 'records', params] as const,
    record: (id: string) => [...attendanceKeys.all, 'record', id] as const,
    summary: () => [...attendanceKeys.all, 'summary'] as const,
    rules: () => [...attendanceKeys.all, 'rules'] as const,
    overrides: (params?: Record<string, unknown>) => [...attendanceKeys.all, 'overrides', params] as const,
    holidays: (params?: Record<string, unknown>) => [...attendanceKeys.all, 'holidays', params] as const,
    rosters: (params?: Record<string, unknown>) => [...attendanceKeys.all, 'rosters', params] as const,
    overtimeRules: () => [...attendanceKeys.all, 'overtime-rules'] as const,
};

// ── Attendance Records ──

export function useAttendanceRecords(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: attendanceKeys.records(params),
        queryFn: () => attendanceApi.listRecords(params as any),
    });
}

export function useAttendanceRecord(id: string) {
    return useQuery({
        queryKey: attendanceKeys.record(id),
        queryFn: () => attendanceApi.getRecord(id),
        enabled: !!id,
    });
}

// ── Summary ──

export function useAttendanceSummary() {
    return useQuery({
        queryKey: attendanceKeys.summary(),
        queryFn: () => attendanceApi.getSummary(),
    });
}

// ── Rules ──

export function useAttendanceRules() {
    return useQuery({
        queryKey: attendanceKeys.rules(),
        queryFn: () => attendanceApi.getRules(),
    });
}

// ── Overrides ──

export function useAttendanceOverrides(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: attendanceKeys.overrides(params),
        queryFn: () => attendanceApi.listOverrides(params as any),
    });
}

// ── Holidays ──

export function useHolidays(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: attendanceKeys.holidays(params),
        queryFn: () => attendanceApi.listHolidays(params as any),
    });
}

// ── Rosters ──

export function useRosters(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: attendanceKeys.rosters(params),
        queryFn: () => attendanceApi.listRosters(params as any),
    });
}

// ── Overtime Rules ──

export function useOvertimeRules() {
    return useQuery({
        queryKey: attendanceKeys.overtimeRules(),
        queryFn: () => attendanceApi.getOvertimeRules(),
    });
}
