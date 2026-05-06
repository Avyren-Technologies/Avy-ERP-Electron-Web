import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/lib/api/leave';
import { leaveKeys } from './use-leave-queries';

// ── Leave Types ──

export function useCreateLeaveType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => leaveApi.createLeaveType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.leaveTypes() });
        },
    });
}

export function useUpdateLeaveType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            leaveApi.updateLeaveType(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.leaveType(variables.id) });
            queryClient.invalidateQueries({ queryKey: leaveKeys.leaveTypes() });
        },
    });
}

export function useDeleteLeaveType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, force = false }: { id: string; force?: boolean }) => leaveApi.deleteLeaveType(id, force),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.leaveTypes() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}

// ── Leave Policies ──

export function useCreateLeavePolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => leaveApi.createPolicy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
        },
    });
}

export function useUpdateLeavePolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            leaveApi.updatePolicy(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
        },
    });
}

export function useDeleteLeavePolicy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => leaveApi.deletePolicy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.policies() });
        },
    });
}

// ── Leave Balances ──

export function useAdjustLeaveBalance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => leaveApi.adjustBalance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
        },
    });
}

export function useInitializeLeaveBalances() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => leaveApi.initializeBalances(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}

// ── Leave Requests ──

export function useCreateLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => leaveApi.createRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
        },
    });
}

export function useApproveLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            leaveApi.approveRequest(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.request(variables.id) });
            queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
        },
    });
}

export function useRejectLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            leaveApi.rejectRequest(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.request(variables.id) });
            queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
        },
    });
}

export function useCancelLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            leaveApi.cancelRequest(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.request(variables.id) });
            queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
            queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
        },
    });
}

// ── Leave Balance — Direct Edit ──

export function useUpdateBalance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => leaveApi.updateBalance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}

// ── Leave Balance — Encashment ──

export function useEncashBalance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => leaveApi.encashBalance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}

// ── Leave Balance — Accrual & Carry Forward ──

export function useRunAccrual() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { month: number; year: number; dayOfMonth?: number }) => leaveApi.accrueBalances(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}

export function useRunCarryForward() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { fromYear: number; toYear: number }) => leaveApi.carryForwardBalances(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}

// ── Leave Balance — Bulk Import ──

export function useValidateBalanceUpload() {
    return useMutation({
        mutationFn: (file: File) => leaveApi.validateBalanceUpload(file),
    });
}

export function useConfirmBalanceImport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (rows: any[]) => leaveApi.confirmBalanceImport(rows),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.balances() });
        },
    });
}
