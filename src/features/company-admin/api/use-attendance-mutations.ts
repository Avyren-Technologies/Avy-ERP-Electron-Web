import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, remapShift, editPunches, markReviewed } from '@/lib/api/attendance';
import { attendanceKeys } from './use-attendance-queries';

// ── Attendance Records ──

export function useCreateAttendanceRecord() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => attendanceApi.createRecord(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.summary() });
        },
    });
}

export function useUpdateAttendanceRecord() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            attendanceApi.updateRecord(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.record(variables.id) });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.summary() });
        },
    });
}

// ── Attendance Rules ──

export function useUpdateAttendanceRules() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => attendanceApi.updateRules(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.rules() });
        },
    });
}

// ── Attendance Overrides ──

export function useCreateAttendanceOverride() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => attendanceApi.createOverride(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.overrides() });
        },
    });
}

export function useUpdateAttendanceOverride() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            attendanceApi.updateOverride(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.overrides() });
            queryClient.invalidateQueries({ queryKey: attendanceKeys.records() });
        },
    });
}

// ── Holidays ──

export function useCreateHoliday() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => attendanceApi.createHoliday(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.holidays() });
        },
    });
}

export function useUpdateHoliday() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            attendanceApi.updateHoliday(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.holidays() });
        },
    });
}

export function useDeleteHoliday() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => attendanceApi.deleteHoliday(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.holidays() });
        },
    });
}

export function useCloneHolidays() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => attendanceApi.cloneHolidays(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.holidays() });
        },
    });
}

// ── Rosters ──

export function useCreateRoster() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => attendanceApi.createRoster(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.rosters() });
        },
    });
}

export function useUpdateRoster() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            attendanceApi.updateRoster(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.rosters() });
        },
    });
}

export function useDeleteRoster() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => attendanceApi.deleteRoster(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.rosters() });
        },
    });
}

// ── Overtime Rules ──

export function useUpdateOvertimeRules() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => attendanceApi.updateOvertimeRules(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.overtimeRules() });
        },
    });
}

// ── Overtime Requests ──

export function useApproveOvertimeRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: { approvalNotes?: string } }) =>
            attendanceApi.approveOvertimeRequest(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.overtimeRequests() });
        },
    });
}

export function useRejectOvertimeRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: { approvalNotes?: string } }) =>
            attendanceApi.rejectOvertimeRequest(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.overtimeRequests() });
        },
    });
}

// ── Weekly Review ──

export function useRemapShift() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, shiftId }: { id: string; shiftId: string }) => remapShift(id, { shiftId }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: attendanceKeys.all }); },
    });
}

export function useEditPunches() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; punchIn?: string; punchOut?: string; reason: string }) => editPunches(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: attendanceKeys.all }); },
    });
}

export function useMarkReviewed() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { recordIds: string[] }) => markReviewed(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: attendanceKeys.all }); },
    });
}
