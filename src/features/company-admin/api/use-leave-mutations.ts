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
        mutationFn: (id: string) => leaveApi.deleteLeaveType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: leaveKeys.leaveTypes() });
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
